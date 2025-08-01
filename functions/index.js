const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const app = express();


app.use(cors({ origin: true }));
app.use(express.json());

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue; 

// Função para gerar senha aleatória
const generateRandomPassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

app.post('/criarResponsavelAluno', async (req, res) => {
  console.log('Recebido no backend:', req.body);
  try {
    const { aluno, responsavel } = req.body;

    // Validação de Dados de Entrada
    if (!aluno || !responsavel) {
      console.error('Dados incompletos: aluno ou responsavel faltando');
      return res.status(400).send({ error: 'Dados incompletos: aluno ou responsavel faltando' });
    }

    if (
      !aluno.nome || !aluno.dataNascimento || !aluno.categoria ||
      !responsavel.nome || !responsavel.email || !responsavel.telefone
    ) {
      console.error('Campos obrigatórios faltando:', { aluno, responsavel });
      return res.status(400).send({ error: 'Campos obrigatórios faltando' });
    }

    // verificação e criação/atualização do usuário responsável no firebase auth
    let userRecord;
    let uidResponsavel;
    let isNewUser = false;

    try {
      userRecord = await auth.getUserByEmail(responsavel.email);
      uidResponsavel = userRecord.uid;
      console.log('Usuário responsável encontrado:', uidResponsavel);

  
      await db.collection('usuarios').doc(uidResponsavel).update({
        nome: responsavel.nome,
        email: responsavel.email,
        telefone: responsavel.telefone,
      });

    } catch (error) {
      // se o usuário não existe, cria um novo
      if (error.code === 'auth/user-not-found') {
        console.log('Usuário responsável não existe, criando novo...');
        isNewUser = true;

        // geração da senha aleatória
        const randomPassword = generateRandomPassword(); //função para gerar a senha

        const user = await auth.createUser({
          email: responsavel.email,
          password: randomPassword, // senha gerada aleatoriamente
          displayName: responsavel.nome,
        });
        uidResponsavel = user.uid;

        // Cria o documento do usuário na coleção 'usuarios' com a role e array de alunoIds vazio
        await db.collection('usuarios').doc(uidResponsavel).set({
          nome: responsavel.nome,
          email: responsavel.email,
          telefone: responsavel.telefone,
          role: 'responsavel',
          alunoIds: [], // inicia como um array vazio
          dataCadastro: FieldValue.serverTimestamp(), 
        });
      } else {
        console.error('Erro ao buscar/criar usuário no Auth:', error);
        return res.status(500).send({ error: `Erro de autenticação: ${error.message}` });
      }
    }

    // cálculo da idade do aluno 
    const hoje = new Date();
    const nasc = new Date(aluno.dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;

    // criação do documento do aluno na coleção 'alunos'
    const alunoRef = await db.collection('alunos').add({
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento,
      idade: idade, //idade calculada
      categoria: aluno.categoria,
      numeroCamisa: aluno.numeroCamisa || '',
      presencas: [], // presenças é um array vazio
      responsavelId: uidResponsavel, // vincula o aluno ao UID do responsável
      dataCadastro: FieldValue.serverTimestamp(), //  timestamp de criação do aluno
      ativo: aluno.ativo !== undefined ? aluno.ativo : true, //  ativo por padrão, o
    });

    // vinculação do aluno ao responsável (adiciona o ID do aluno ao array 'alunoIds' do responsável)
    await db.collection('usuarios').doc(uidResponsavel).update({
      alunoIds: FieldValue.arrayUnion(alunoRef.id), // adiciona o ID do novo aluno ao array
    });

    // 6. Resposta de Sucesso
    let successMessage = 'Aluno e responsável cadastrados com sucesso!';
    if (isNewUser) {
      successMessage += 'Uma senha temporária foi definida para o responsável, que deverá redefini-la no primeiro acesso.'; 
    }
    return res.status(200).send({ message: successMessage });

  } catch (error) {
    console.error('Erro na função criarResponsavelAluno:', error);
    return res.status(500).send({ error: error.message || error.toString() });
  }
});

exports.api = functions.https.onRequest(app);