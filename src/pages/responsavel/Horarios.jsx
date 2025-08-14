import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faMapMarkerAlt, faFutbol } from '@fortawesome/free-solid-svg-icons';
import FeedbackModal from "../../../src/components/FeedbackModal";


export default function ParentSchedules() {
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });
  const navigate = useNavigate();

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
        // Busca todos os alunos vinculados a este responsável
        const qAlunos = query(collection(db, 'alunos'), where('responsavelId', '==', user.uid));
        const alunosSnapshot = await getDocs(qAlunos);
        
        if (!alunosSnapshot.empty) {
          const listaAlunos = alunosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAlunos(listaAlunos);

          const horariosPorAluno = {};
          // Para cada aluno, busca os horários de treino correspondentes no Firestore
          for (const aluno of listaAlunos) {
            if (aluno.categoria) {
              const qHorarios = query(collection(db, 'horarios'), where('categoria', '==', aluno.categoria));
              const horariosSnap = await getDocs(qHorarios);
              horariosPorAluno[aluno.id] = horariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
               horariosPorAluno[aluno.id] = [];
            }
          }
          setHorarios(horariosPorAluno);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <p className="text-xl text-gray-700">Carregando horários de treino...</p>
      </div>
    );
  }

  if (feedbackModal.show && feedbackModal.type === "error" && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => navigate('/')}
        />
      </div>
    );
  }

  const diasDaSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center md:px-8 lg:px-12 sm:ml-64 pt-20 lg:pt-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
        Horários de Treino
      </h1>

      <div className="w-full max-w-6xl space-y-6">
        {alunos.length > 0 ? (
          alunos.map(aluno => (
            <div key={aluno.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faFutbol} className="text-yellow-500" />
                {aluno.nome} ({aluno.categoria})
              </h2>

              {horarios[aluno.id] && horarios[aluno.id].length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diasDaSemana.map(dia => {
                    const treinosDoDia = horarios[aluno.id].filter(treino => treino.diaSemana === dia);
                    return treinosDoDia.map(treino => (
                      <div key={treino.id} className="bg-blue-50 p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                          {treino.diaSemana}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>
                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                            <strong>Horário:</strong> {treino.horario}
                          </p>
                          <p>
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                            <strong>Local:</strong> {treino.local}
                          </p>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              ) : (
                <p className="text-gray-700 text-base text-center mt-4">Nenhum horário de treino cadastrado para este aluno.</p>
              )}
            </div>
          ))
        ) : (
          <div className="w-full bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center">
            <p className="text-lg text-gray-700 font-medium">Nenhum aluno vinculado à sua conta.</p>
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
