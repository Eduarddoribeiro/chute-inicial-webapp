import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from "../../../src/components/FeedbackModal"; 

const categorias = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'];

export default function CadastroResponsavelAluno() {
  const [aluno, setAluno] = useState({
    nome: '',
    dataNascimento: '',
    categoria: '',
    numeroCamisa: '',
    ativo: true, 
  });
  const [responsavel, setResponsavel] = useState({
    nome: '',
    email: '',
    telefone: '',
  });
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  // Estado feedback
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });

  const handleChange = (e, entidade) => {
    const { name, value } = e.target;
    if (entidade === 'aluno') {
      setAluno({ ...aluno, [name]: value });
    } else {
      setResponsavel({ ...responsavel, [name]: value });
    }
  };

  //idade calculo
  const calcularIdade = (dataNasc) => {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  // Cloud function
  const cadastrarResponsavelAluno = async (alunoData, responsavelData) => { 
    const url = 'https://api-q6a2n7yk5a-uc.a.run.app/criarResponsavelAluno';

    const idadeCalculada = calcularIdade(alunoData.dataNascimento);

    const body = {
      aluno: {
        ...alunoData,
        idade: idadeCalculada,
        dataCadastro: new Date().toISOString().split('T')[0], //formata data
        presencas: [], // Devo deixar array vazio
      },
      responsavel: responsavelData, 
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao cadastrar');
    }

    const data = await response.json();
    return data.message;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setErro('');
    setCarregando(true);

    try {
      // Validação simples
      if (
        !aluno.nome.trim() ||
        !aluno.dataNascimento.trim() ||
        !aluno.categoria ||
        !responsavel.nome.trim() ||
        !responsavel.email.trim() ||
        !responsavel.telefone.trim()
      ) {
        setFeedbackModal({
          show: true,
          message: "Por favor, preencha todos os campos obrigatórios.",
          type: "error",
        });
        setCarregando(false);
        return;
      }

      const mensagemSucesso = await cadastrarResponsavelAluno(aluno, responsavel);
      setFeedbackModal({
        show: true,
        message: mensagemSucesso,
        type: "success",
      });

      // Limpa formulário
      setAluno({ nome: '', dataNascimento: '', categoria: '', numeroCamisa: '', ativo: true }); 
      setResponsavel({ nome: '', email: '', telefone: '' });
    } catch (error) {
      setFeedbackModal({
        show: true,
        message: "Erro ao cadastrar: " + error.message,
        type: "error",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl pl-2 pr-2 pt-8 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          Cadastrar Aluno e Responsável
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Aluno */}
          <fieldset className="border border-gray-200 p-6 rounded-lg shadow-md">
            <legend className="text-lg font-semibold text-gray-800 px-2">Dados do Aluno</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="alunoNome" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  id="alunoNome"
                  name="nome"
                  placeholder="Nome do aluno"
                  value={aluno.nome}
                  onChange={(e) => handleChange(e, 'aluno')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  id="dataNascimento"
                  name="dataNascimento"
                  value={aluno.dataNascimento}
                  onChange={(e) => handleChange(e, 'aluno')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={aluno.categoria}
                  onChange={(e) => handleChange(e, 'aluno')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                  required
                >
                  <option value="">Selecione a categoria</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="numeroCamisa" className="block text-sm font-medium text-gray-700 mb-1">Número da Camisa (Opcional)</label>
                <input
                  type="text"
                  id="numeroCamisa"
                  name="numeroCamisa"
                  placeholder="Ex: 10"
                  value={aluno.numeroCamisa}
                  onChange={(e) => handleChange(e, 'aluno')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                />
              </div>
            </div>
          </fieldset>

          {/* Dados do Responsável */}
          <fieldset className="border border-gray-200 p-6 rounded-lg shadow-md">
            <legend className="text-lg font-semibold text-gray-800 px-2">Dados do Responsável</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="responsavelNome" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  id="responsavelNome"
                  name="nome"
                  placeholder="Nome do responsável"
                  value={responsavel.nome}
                  onChange={(e) => handleChange(e, 'responsavel')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="responsavelEmail" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  id="responsavelEmail"
                  name="email"
                  placeholder="email@exemplo.com"
                  value={responsavel.email}
                  onChange={(e) => handleChange(e, 'responsavel')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="responsavelTelefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  id="responsavelTelefone"
                  name="telefone"
                  placeholder="(XX) XXXXX-XXXX"
                  value={responsavel.telefone}
                  onChange={(e) => handleChange(e, 'responsavel')}
                  className="pl-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50"
                  required
                />
              </div>
            </div>
          </fieldset>


          {/* Botões de ação */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-md border border-gray-300 bg-white px-4 mb-2 py-2 text-gray-700 shadow-sm transition duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className={`rounded-md px-6 py-3 mb-2 text-lg font-semibold text-white shadow-sm transition duration-300 ease-in-out
                ${carregando ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75'}`}
            >
              {carregando ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Modal*/}
      {feedbackModal.show && (
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => setFeedbackModal({ show: false, message: "", type: "" })}
        />
      )}
    </div>
  );
}