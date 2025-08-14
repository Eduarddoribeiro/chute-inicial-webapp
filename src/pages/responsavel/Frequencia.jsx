import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faClipboardCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import FeedbackModal from "../../../src/components/FeedbackModal";

export default function ParentAttendance() {
  const [loading, setLoading] = useState(true);
  const [aluno, setAluno] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const alunoId = location.state?.alunoId;

  // Busca lista de alunos vinculados ao responsável
  async function fetchAlunosDoResponsavel(userId) {
    const q = query(collection(db, 'alunos'), where('responsavelId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        setFeedbackModal({ show: true, message: 'Usuário não autenticado. Redirecionando...', type: 'error' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        if (alunoId) {
          // Se veio o alunoId, busca dados do aluno
          const alunoRef = doc(db, 'alunos', alunoId);
          const alunoSnap = await getDoc(alunoRef);

          if (alunoSnap.exists()) {
            const alunoData = alunoSnap.data();
            if (alunoData.responsavelId !== user.uid) {
              setFeedbackModal({ show: true, message: 'Você não tem permissão para ver este aluno.', type: 'error' });
              setTimeout(() => navigate('/responsavel'), 2000);
              return;
            }
            setAluno({ id: alunoSnap.id, ...alunoData });
          } else {
            setFeedbackModal({ show: true, message: 'Aluno não encontrado.', type: 'error' });
            setTimeout(() => navigate('/responsavel'), 2000);
          }
        } else {
          // Se não veio alunoId, pega lista de alunos para o usuário escolher
          const listaAlunos = await fetchAlunosDoResponsavel(user.uid);
          if (listaAlunos.length === 0) {
            setFeedbackModal({ show: true, message: 'Nenhum aluno vinculado à sua conta.', type: 'info' });
          } else {
            setAlunos(listaAlunos);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setFeedbackModal({ show: true, message: 'Erro ao carregar os dados. Tente novamente.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [alunoId, navigate]);

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    let dataObj = new Date(dataString);
    if (isNaN(dataObj.getTime())) return 'Data Inválida';

    return `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}/${dataObj.getFullYear()}`;
  };

  // Quando o usuário seleciona um aluno da lista, navega para a mesma página com alunoId no state
  const handleSelecionarAluno = (id) => {
    navigate('/responsavel/frequencia', { state: { alunoId: id } });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <p className="text-xl text-gray-700">Carregando histórico de frequência...</p>
      </div>
    );
  }

  if (feedbackModal.show && feedbackModal.type === "error" && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => navigate('/responsavel')}
        />
      </div>
    );
  }

  // Se não tem aluno selecionado e tem lista de alunos, mostra seletor
  if (!aluno && alunos.length > 0) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center md:px-8 lg:px-12 sm:ml-64 pt-20 lg:pt-24">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Selecione um aluno para ver a frequência</h1>
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <ul>
            {alunos.map(aluno => (
              <li
                key={aluno.id}
                className="cursor-pointer p-3 border-b last:border-none hover:bg-gray-100 flex items-center gap-3"
                onClick={() => handleSelecionarAluno(aluno.id)}
              >
                <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                <span className="font-medium text-gray-800">{aluno.nome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Se tem aluno selecionado, mostra a frequência
  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center md:px-8 lg:px-12 sm:ml-64 pt-20 lg:pt-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
        Frequência de {aluno?.nome}
      </h1>

      <div className="w-full max-w-4xl space-y-6">
        {aluno?.presencas?.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faClipboardCheck} className="text-blue-500" />
              Histórico de presença
            </h2>
            <div className="space-y-4">
              {[...aluno.presencas]
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map((presenca, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg shadow-sm border ${
                      presenca.presente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-700">
                      {formatarData(presenca.data)}
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        presenca.presente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <FontAwesomeIcon icon={presenca.presente ? faCheckCircle : faTimesCircle} />
                      {presenca.presente ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center">
            <p className="text-lg text-gray-700 font-medium">
              Nenhum registro de frequência encontrado.
            </p>
          </div>
        )}
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
