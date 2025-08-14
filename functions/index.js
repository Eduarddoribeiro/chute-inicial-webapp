const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

admin.initializeApp();
const app = express();

// Configura o CORS para permitir requisições apenas do seu domínio do Vercel
const corsOptions = {
  origin: 'https://chute-inicial-webapp.vercel.app',
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));
app.use(express.json());

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

const generateRandomPassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// --- ROTA: CRIAR RESPONSÁVEL E ALUNO ---
app.post('/criarResponsavelAluno', async (req, res) => {
  console.log('Recebido no backend:', req.body);
  try {
    const { aluno, responsavel } = req.body;
    if (!aluno || !responsavel) {
      return res.status(400).json({ error: 'Dados incompletos: aluno ou responsavel faltando' });
    }
    if (
      !aluno.nome || !aluno.dataNascimento || !aluno.categoria ||
      !responsavel.nome || !responsavel.email || !responsavel.telefone
    ) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    let userRecord;
    let uidResponsavel;
    let isNewUser = false;
    try {
      userRecord = await auth.getUserByEmail(responsavel.email);
      uidResponsavel = userRecord.uid;
      await db.collection('usuarios').doc(uidResponsavel).update({
        nome: responsavel.nome,
        email: responsavel.email,
        telefone: responsavel.telefone,
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        isNewUser = true;
        const randomPassword = generateRandomPassword();
        const user = await auth.createUser({
          email: responsavel.email,
          password: randomPassword,
          displayName: responsavel.nome,
        });
        uidResponsavel = user.uid;
        await db.collection('usuarios').doc(uidResponsavel).set({
          nome: responsavel.nome,
          email: responsavel.email,
          telefone: responsavel.telefone,
          role: 'responsavel',
          alunoIds: [],
          dataCadastro: FieldValue.serverTimestamp(),
        });
      } else {
        return res.status(500).json({ error: `Erro de autenticação: ${error.message}` });
      }
    }
    const hoje = new Date();
    const nasc = new Date(aluno.dataNascimento);
    if (isNaN(nasc.getTime())) {
      return res.status(400).json({ error: 'Data de nascimento inválida.' });
    }
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    const alunoRef = await db.collection('alunos').add({
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento,
      idade: idade,
      categoria: aluno.categoria,
      numeroCamisa: aluno.numeroCamisa || '',
      presencas: [],
      responsavelId: uidResponsavel,
      dataCadastro: FieldValue.serverTimestamp(),
      ativo: aluno.ativo !== undefined ? aluno.ativo : true,
    });
    await db.collection('usuarios').doc(uidResponsavel).update({
      alunoIds: FieldValue.arrayUnion(alunoRef.id),
    });
    let successMessage = 'Aluno e responsável cadastrados com sucesso!';
    if (isNewUser) {
      successMessage += ' Uma senha temporária foi definida para o responsável.';
    }
    return res.status(200).json({ message: successMessage });
  } catch (error) {
    console.error('Erro na função criarResponsavelAluno:', error);
    return res.status(500).json({ error: error.message || error.toString() });
  }
});

// --- ROTA: LANÇAR MENSALIDADE ---
app.post('/lancarMensalidade', async (req, res) => {
  console.log('Recebido na Cloud Function lancarMensalidade:', req.body);
  try {
    const { responsavelId, alunoId, mesReferencia, valor, responsavelEmail, alunoNome } = req.body;
    if (!responsavelId || !alunoId || !mesReferencia || valor === undefined || valor <= 0 || !responsavelEmail || !alunoNome) {
      return res.status(400).json({ error: 'Dados incompletos ou inválidos para lançar mensalidade.' });
    }
    const existingPaymentSnapshot = await db.collection('pagamentos')
      .where('alunoId', '==', alunoId)
      .where('mesReferencia', '==', mesReferencia)
      .get();
    if (!existingPaymentSnapshot.empty) {
      return res.status(409).json({ message: `Mensalidade para ${alunoNome} em ${mesReferencia} já foi lançada.` });
    }
    await db.collection('pagamentos').add({
      alunoId,
      responsavelId,
      mesReferencia,
      valor,
      status: 'pendente',
      dataCriacao: FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ message: 'Mensalidade lançada com sucesso!' });
  } catch (error) {
    console.error('Erro na função lancarMensalidade:', error);
    return res.status(500).json({ error: error.message || 'Erro ao lançar mensalidade.' });
  }
});

// --- ROTA: LANÇAR MENSALIDADES EM LOTE ---
app.post('/lancarMensalidadesEmLote', async (req, res) => {
  console.log('Recebido na Cloud Function lancarMensalidadesEmLote:', req.body);
  try {
    const { mesReferencia } = req.body;
    if (!mesReferencia) {
      return res.status(400).json({ error: 'Mês de referência é obrigatório.' });
    }
    const responsaveisQuery = await db.collection('usuarios').where('role', '==', 'responsavel').get();
    if (responsaveisQuery.empty) {
      return res.status(200).json({ message: 'Nenhum responsável encontrado para lançamento de mensalidades.' });
    }
    const batch = db.batch();
    let lancamentosCount = 0;
    let jaExistenteCount = 0;
    for (const responsavelDoc of responsaveisQuery.docs) {
      const responsavelData = responsavelDoc.data();
      const responsavelId = responsavelDoc.id;
      const alunosQuery = await db.collection('alunos')
        .where('responsavelId', '==', responsavelId)
        .where('ativo', '==', true)
        .get();
      const alunosAtivos = alunosQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (alunosAtivos.length === 0) {
        console.log(`Responsável ${responsavelData.nome} (${responsavelId}) não possui alunos ativos. Ignorando.`);
        continue;
      }
      const valorPorAluno = 1.00;
      for (const aluno of alunosAtivos) {
        const pagamentoRef = db.collection('pagamentos').doc();
        const existingPaymentQuery = await db.collection('pagamentos')
          .where('alunoId', '==', aluno.id)
          .where('mesReferencia', '==', mesReferencia)
          .limit(1)
          .get();
        if (existingPaymentQuery.empty) {
          batch.set(pagamentoRef, {
            alunoId: aluno.id,
            responsavelId: responsavelId,
            mesReferencia: mesReferencia,
            valor: valorPorAluno,
            status: 'pendente',
            dataCriacao: FieldValue.serverTimestamp(),
            alunoNome: aluno.nome,
            responsavelNome: responsavelData.nome,
            responsavelEmail: responsavelData.email,
          });
          lancamentosCount++;
        } else {
          jaExistenteCount++;
          console.log(`Mensalidade para ${aluno.nome} (${mesReferencia}) já existe. Ignorando.`);
        }
      }
    }
    if (lancamentosCount > 0) {
      await batch.commit();
    }
    let message = `Lançamento em lote concluído. ${lancamentosCount} mensalidades lançadas.`;
    if (jaExistenteCount > 0) {
      message += ` ${jaExistenteCount} mensalidades já existentes foram ignoradas.`;
    }
    if (lancamentosCount === 0 && jaExistenteCount > 0) {
      message = 'Nenhum lançamento de mensalidade foi necessário ou encontrado.';
    }
    console.log(message);
    return res.status(200).json({ message });
  } catch (error) {
    console.error('Erro na Cloud Function lancarMensalidadesEmLote:', error);
    return res.status(500).json({ error: error.message || 'Erro ao lançar mensalidades em lote.' });
  }
});

// AQUI ESTÁ A CORREÇÃO FINAL. O código precisa ser exportado dessa forma para o Cloud Functions de 2a geração
const api = functions.https.onRequest(app);

module.exports = {
  api
};
