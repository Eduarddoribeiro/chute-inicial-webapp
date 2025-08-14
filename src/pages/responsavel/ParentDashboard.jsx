import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faInfoCircle, faFutbol, faClock, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import FeedbackModal from "../../../src/components/FeedbackModal";

export default function ParentDashboard() {
  const [responsavel, setResponsavel] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });
  const navigate = useNavigate();

  const [proximoTreino, setProximoTreino] = useState(null);

  const findNextTrainingDate = (trainingDays) => {
    if (!trainingDays || trainingDays.length === 0) return null;

    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const today = new Date();
    const todayIndex = today.getDay();

    for (let i = 0; i < 7; i++) {
      const currentDayIndex = (todayIndex + i) % 7;
      const currentDayName = daysOfWeek[currentDayIndex];
      const treinosHoje = trainingDays.filter(t => t.diaSemana === currentDayName);
      if (treinosHoje.length > 0) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        return { date: nextDate, schedule: treinosHoje[0] };
      }
    }
    return null;
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setFeedbackModal({ show: true, message: 'Usuário não autenticado. Redirecionando...', type: 'error' });
        setTimeout(() => navigate('/'), 2000);
        setLoading(false);
        return;
      }

      try {
        const responsavelRef = doc(db, 'usuarios', user.uid);
        const responsavelSnap = await getDoc(responsavelRef);
        if (!responsavelSnap.exists()) {
          setFeedbackModal({ show: true, message: 'Dados do responsável não encontrados. Contate o suporte.', type: 'error' });
          setLoading(false);
          return;
        }
        setResponsavel(responsavelSnap.data());

        const q = query(collection(db, 'alunos'), where('responsavelId', '==', user.uid));
        const alunosSnapshot = await getDocs(q);
        if (!alunosSnapshot.empty) {
          const listaAlunos = alunosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAlunos(listaAlunos);
          setAlunoSelecionado(listaAlunos[0]);
        } else {
          setFeedbackModal({ show: true, message: 'Nenhum aluno vinculado à sua conta.', type: 'info' });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setFeedbackModal({ show: true, message: 'Erro ao carregar seus dados. Tente novamente.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    async function getNextTraining() {
      if (alunoSelecionado && alunoSelecionado.categoria) {
        const qHorarios = query(collection(db, 'horarios'), where('categoria', '==', alunoSelecionado.categoria));
        const horariosSnap = await getDocs(qHorarios);
        const treinosDoAluno = horariosSnap.docs.map(doc => doc.data());
        const next = findNextTrainingDate(treinosDoAluno);
        setProximoTreino(next);
      } else {
        setProximoTreino(null);
      }
    }
    getNextTraining();
  }, [alunoSelecionado]);

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    let dataObj = typeof dataString === 'number' ? new Date(dataString) : new Date(dataString);
    if (isNaN(dataObj.getTime())) return 'Data Inválida';
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <p className="text-xl text-gray-700">Carregando dados do painel...</p>
      </div>
    );
  }

  if (feedbackModal.show && feedbackModal.type === "error" && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen  px-4 py-8 flex flex-col items-center md:px-8 lg:px-12 sm:ml-64 sm:pt-20 lg:pt-24">
      {/* Banner de Boas-Vindas */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Olá, {responsavel?.nome.split(' ')[0] || 'Responsável'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo(a) à área do responsável do Chute Inicial.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna principal: cards dos alunos */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {alunos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {alunos.map(aluno => {
                const ultimaPresenca = aluno?.presencas
                  ? [...aluno.presencas].sort((a, b) => new Date(b.data) - new Date(a.data))[0]
                  : null;
                return (
                  <div
                    key={aluno.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border cursor-pointer transition-all duration-200 
                      ${aluno.id === alunoSelecionado?.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}
                    onClick={() => setAlunoSelecionado(aluno)}
                  >
                    <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faFutbol} className="text-green-500" />
                      {aluno.nome}
                    </h2>
                    <div className="space-y-2 text-gray-700 text-sm">
                      <p><strong>Categoria:</strong> {aluno.categoria}</p>
                      <p><strong>Nascimento:</strong> {formatarData(aluno.dataNascimento)}</p>
                      <p><strong>Idade:</strong> {aluno.idade} anos</p>
                      <p><strong>Última Presença:</strong> {ultimaPresenca ? formatarData(ultimaPresenca.data) : 'N/A'}</p>
                      <p className="flex items-center gap-2">
                        <strong>Status:</strong>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${aluno.ativo ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {aluno.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/responsavel/frequencia', { state: { alunoId: aluno.id } });
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-full shadow hover:bg-blue-700 transition-all"
                      >
                        <FontAwesomeIcon icon={faClipboardCheck} className="mr-2" />
                        Ver Frequência
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex items-center justify-center min-h-[300px]">
              <p className="text-lg text-gray-700 font-medium text-center">
                {feedbackModal.message}
              </p>
            </div>
          )}
        </div>

        {/* Coluna lateral: Próximo Treino e Seus Dados */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 h-fit">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faFutbol} className="text-purple-500" /> Próximo Treino
            </h2>
            {proximoTreino ? (
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800">
                  <span className="font-semibold">{proximoTreino.schedule.diaSemana}:</span> {formatarData(proximoTreino.date.toISOString())}
                </p>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} /> {proximoTreino.schedule.horario}
                </p>
              </div>
            ) : (
              <p className="text-gray-700 text-base">Nenhum treino agendado para o aluno selecionado.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 h-fit">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500" /> Seus Dados
            </h2>
            {responsavel && (
              <div className="space-y-3 text-gray-700 text-base">
                <p className="border-b border-gray-100 pb-2">
                  <strong>Nome:</strong> {responsavel.nome}
                </p>
                <p className="border-b border-gray-100 pb-2">
                  <strong>Email:</strong> {responsavel.email}
                </p>
                <p>
                  <strong>Telefone:</strong> {responsavel.telefone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {feedbackModal.show && feedbackModal.type !== 'error' && (
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => setFeedbackModal({ show: false, message: "", type: "" })}
        />
      )}
    </div>
  );
}
