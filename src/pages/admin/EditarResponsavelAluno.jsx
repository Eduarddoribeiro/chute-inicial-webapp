import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

import FeedbackModal from "../../../src/components/FeedbackModal";

const categorias = [
  "Sub-7",
  "Sub-9",
  "Sub-11",
  "Sub-13",
  "Sub-15",
];

export default function EditarAluno() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  // REMOVIDO: const [idade, setIdade] = useState(''); // Campo de idade não será mais editável
  const [categoria, setCategoria] = useState('');
  const [numeroCamisa, setNumeroCamisa] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [responsavelId, setResponsavelId] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false); 

  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });

  const formatarDataParaInput = (dataIso) => {
    if (dataIso instanceof Date) {
      return dataIso.toISOString().split('T')[0];
    }
    return dataIso;
  };

  useEffect(() => {
    async function carregarAluno() {
      setLoading(true);
      setFeedbackModal({ show: false, message: "", type: "" });
      try {
        const docRef = doc(db, 'alunos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNome(data.nome || '');
          setDataNascimento(formatarDataParaInput(data.dataNascimento) || '');
          // REMOVIDO: setIdade(data.idade || ''); // Não define mais o estado de idade
          setCategoria(data.categoria || '');
          setNumeroCamisa(data.numeroCamisa || '');
          setAtivo(data.ativo !== undefined ? data.ativo : true);

          setResponsavelId(data.responsavelId || null);

          if (data.responsavelId) {
            const responsavelDocRef = doc(db, 'usuarios', data.responsavelId);
            const responsavelDocSnap = await getDoc(responsavelDocRef);
            if (responsavelDocSnap.exists()) {
              const responsavelData = responsavelDocSnap.data();
              setNomeResponsavel(responsavelData.nome || '');
              setEmailResponsavel(responsavelData.email || '');
              setTelefoneResponsavel(responsavelData.telefone || '');
            } else {
              console.warn(`Responsável com ID ${data.responsavelId} não encontrado para o aluno ${data.nome}.`);
              setNomeResponsavel('N/A');
              setEmailResponsavel('N/A');
              setTelefoneResponsavel('N/A');
            }
          } else {
            setNomeResponsavel('N/A');
            setEmailResponsavel('N/A');
            setTelefoneResponsavel('N/A');
          }

        } else {
          setFeedbackModal({ show: true, message: 'Aluno não encontrado.', type: 'error' });
          setTimeout(() => navigate('/admin/dashboard'), 2000); 
        }
      } catch (error) {
        console.error('Erro ao carregar aluno:', error);
        setFeedbackModal({ show: true, message: 'Erro ao carregar dados do aluno.', type: 'error' });
        setTimeout(() => navigate('/admin/dashboard'), 2000);
      } finally {
        setLoading(false);
      }
    }
    carregarAluno();
  }, [id, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedbackModal({ show: false, message: "", type: "" });
    setLoading(true);

    try {
      // ATUALIZADO: Removido !idade da validação
      if (!nome.trim() || !dataNascimento.trim() || !categoria || !nomeResponsavel.trim() || !emailResponsavel.trim() || !telefoneResponsavel.trim()) {
        setFeedbackModal({ show: true, message: 'Por favor, preencha todos os campos obrigatórios.', type: 'error' });
        setLoading(false);
        return;
      }

      // Calcula idade novamente para garantir consistência (se a data de nascimento mudou)
      const hoje = new Date();
      const nasc = new Date(dataNascimento);
      let idadeCalculada = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadeCalculada--;

      await updateDoc(doc(db, 'alunos', id), {
        nome,
        dataNascimento,
        idade: Number(idadeCalculada), // A idade será sempre calculada a partir da data de nascimento
        categoria,
        numeroCamisa: numeroCamisa || '',
        ativo,
      });

      if (responsavelId) {
        await updateDoc(doc(db, 'usuarios', responsavelId), {
          nome: nomeResponsavel,
          email: emailResponsavel,
          telefone: telefoneResponsavel,
        });
      } else {
        console.warn('Aluno sem responsavelId. Dados do responsável não foram atualizados.');
      }

      setFeedbackModal({ show: true, message: 'Dados atualizados com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setFeedbackModal({ show: true, message: 'Erro ao atualizar: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluirAluno() {
    setFeedbackModal({ show: false, message: "", type: "" });
    setConfirmarExclusao(false);
    setLoading(true);

    try {
      await deleteDoc(doc(db, 'alunos', id));

      if (responsavelId) {
        const responsavelDocRef = doc(db, 'usuarios', responsavelId);
        const responsavelDocSnap = await getDoc(responsavelDocRef);
        
        if (responsavelDocSnap.exists()) {
          const q = query(collection(db, 'alunos'), where('responsavelId', '==', responsavelId));
          const alunosDoResponsavelQuery = await getDocs(q);

          if (alunosDoResponsavelQuery.empty || (alunosDoResponsavelQuery.docs.length === 1 && alunosDoResponsavelQuery.docs[0].id === id)) {
            // Se este é o último aluno do responsável a ser excluído
            await updateDoc(responsavelDocRef, { alunoIds: arrayRemove(id) }); 
            setFeedbackModal({ show: true, message: 'Aluno excluído com sucesso e responsável desvinculado!', type: 'success' });
          } else {
            // Se houver outros alunos, apenas remove o ID deste aluno do array
            await updateDoc(responsavelDocRef, { alunoIds: arrayRemove(id) });
            setFeedbackModal({ show: true, message: 'Aluno excluído com sucesso!', type: 'success' });
          }
        } else {
          console.warn(`Aviso: Documento do responsável ${responsavelId} não encontrado. Aluno excluído.`);
          setFeedbackModal({ show: true, message: 'Aluno excluído com sucesso (responsável não encontrado para desvinculação).', type: 'warning' });
        }
      } else {
        setFeedbackModal({ show: true, message: 'Aluno excluído com sucesso!', type: 'success' });
      }

      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
      setFeedbackModal({ show: true, message: 'Erro ao excluir aluno: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Carregando dados do aluno...</p>
      </div>
    );
  }

  if (!nome && feedbackModal.type === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-xl text-red-600">{feedbackModal.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          Editar Aluno
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção aluno */}
          <fieldset className="p-0 rounded-lg shadow-sm">
            <legend className="text-lg font-semibold text-gray-800 px-0">Dados do Aluno</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="nomeAluno" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo do Aluno</label>
                <input
                  type="text"
                  id="nomeAluno"
                  placeholder="Nome do aluno"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                />
              </div>
              <div>
                <label htmlFor="dataNascimentoAluno" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  id="dataNascimentoAluno"
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                />
              </div>

              <div>
                <label htmlFor="numeroCamisaAluno" className="block text-sm font-medium text-gray-700 mb-1">Número da Camisa (Opcional)</label>
                <input
                  type="text"
                  id="numeroCamisaAluno"
                  placeholder="Ex: 10"
                  value={numeroCamisa}
                  onChange={e => setNumeroCamisa(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="categoriaAluno" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  id="categoriaAluno"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                >
                  <option value="">Selecione a categoria</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ativoAluno" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="ativoAluno"
                  value={ativo}
                  onChange={e => setAtivo(e.target.value === 'true')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Seção do responsavel */}
          <fieldset className="p-0 rounded-lg shadow-sm">
            <legend className="text-lg font-semibold text-gray-800 px-0">Dados do Responsável</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="nomeResponsavel" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo do Responsável</label>
                <input
                  type="text"
                  id="nomeResponsavel"
                  placeholder="Nome do responsável"
                  value={nomeResponsavel}
                  onChange={e => setNomeResponsavel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="telefoneResponsavel" className="block text-sm font-medium text-gray-700 mb-1">Telefone do Responsável</label>
                <input
                  type="text"
                  id="telefoneResponsavel"
                  placeholder="(XX) XXXXX-XXXX"
                  value={telefoneResponsavel}
                  onChange={e => setTelefoneResponsavel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                />
              </div>
              <div>
                <label htmlFor="emailResponsavel" className="block text-sm font-medium text-gray-700 mb-1">E-mail do Responsável</label>
                <input
                  type="email"
                  id="emailResponsavel"
                  placeholder="email@exemplo.com"
                  value={emailResponsavel}
                  onChange={e => setEmailResponsavel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                  required
                />
              </div>
            </div>
          </fieldset>

          {/*FeedbackModal*/}
          {feedbackModal.show && (
            <FeedbackModal
              message={feedbackModal.message}
              type={feedbackModal.type}
              onClose={() => setFeedbackModal({ show: false, message: "", type: "" })}
            />
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
            
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 sm:w-auto w-full"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="rounded-md bg-yellow-500 px-6 py-3 text-lg font-semibold text-white shadow-sm transition duration-300 ease-in-out hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 sm:w-auto w-full"
            >
              Salvar alterações
            </button>
            <button
              type="button"
              onClick={() => setConfirmarExclusao(true)} 
              className="rounded-md bg-red-600 px-6 py-3 text-lg font-semibold text-white shadow-sm transition duration-300 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 sm:w-auto w-full"
            >
              Excluir Aluno
            </button>
          </div>
        </form>

        {/* Modal confirmação de exclusão */}
        {confirmarExclusao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="relative w-full max-w-md max-h-full">
                  <div className="relative bg-white rounded-lg shadow">
                      {/* fecha modal */}
                      <button 
                          type="button" 
                          className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" 
                          onClick={() => setConfirmarExclusao(false)} 
                      >
                          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                          </svg>
                          <span className="sr-only">Close modal</span>
                      </button>
                      <div className="p-6 text-center">
                          {/* Ícone alerta */}
                          <svg className="mx-auto mb-4 text-gray-400 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                          </svg>
                          <h3 className="mb-5 text-lg font-normal text-gray-500">Tem certeza que deseja excluir este aluno?</h3>
                          <button 
                              onClick={handleExcluirAluno} 
                              type="button" 
                              className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
                          >
                              Sim, tenho certeza
                          </button>
                          <button 
                              onClick={() => setConfirmarExclusao(false)} 
                              type="button" 
                              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                          >
                              Não, cancelar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}