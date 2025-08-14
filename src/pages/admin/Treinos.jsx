import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faClock, faMapMarkerAlt, faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import FeedbackModal from "../../../src/components/FeedbackModal";

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    categoria: '',
    diaSemana: '',
    horario: '',
    local: '',
  });
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: '',
    type: '',
  });

  const diasDaSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const categorias = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15"];
  
  const horariosOpcoes = [
    '09:00 - 10:00',
    '10:30 - 11:30',
    '14:00 - 15:30',
    '16:00 - 17:30',
    '18:00 - 19:00',
  ];
  const locaisOpcoes = [
    'Arena Biguá',
    'Ginásio Nova Geração - Lápis de Cor',
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'horarios'), (snapshot) => {
      const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(fetchedSchedules);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar horários:", error);
      setLoading(false);
      setFeedbackModal({ show: true, message: "Erro ao carregar horários. Tente novamente.", type: "error" });
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    

    if (!newSchedule.categoria || !newSchedule.diaSemana || !newSchedule.horario || !newSchedule.local) {
      setFeedbackModal({ show: true, message: 'Por favor, preencha todos os campos.', type: 'error' });
      return;
    }
    setLoading(true);

    // DEBUG: Verificando o papel do usuário logado
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        const userData = userDoc.data();
        if (userData && userData.role) {
          console.log("Papel (role) do usuário no Firestore:", userData.role);
        } else {
          console.log("Papel (role) do usuário não encontrado no Firestore.");
        }
      } catch (error) {
        console.error("DEBUG: Erro ao buscar o papel do usuário:", error);
      }
    }

    try {
      await addDoc(collection(db, 'horarios'), newSchedule);
      setNewSchedule({ categoria: '', diaSemana: '', horario: '', local: '' });
      setFeedbackModal({ show: true, message: 'Horário adicionado com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Erro ao adicionar horário:", error);
      setFeedbackModal({ show: true, message: 'Erro ao adicionar horário. Verifique suas permissões.', type: 'error' });
      console.log("Usuário logado APÓS o erro:", auth.currentUser);
    } finally {
      setLoading(false);
      console.log("------------------- DEBUG: FIM DO SUBMIT -------------------");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este horário?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'horarios', id));
        setFeedbackModal({ show: true, message: 'Horário excluído com sucesso!', type: 'success' });
      } catch (error) {
        console.error("Erro ao excluir horário:", error);
        setFeedbackModal({ show: true, message: 'Erro ao excluir horário. Tente novamente.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <p className="text-xl text-gray-700">Carregando horários...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Gerenciar Horários
        </h1>

        <div className="mb-8 p-6  rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="text-green-500" /> Adicionar Novo Horário
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={newSchedule.categoria}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-3 py-3"
                >
                  <option value="">Selecione a categoria</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="diaSemana" className="block text-sm font-medium text-gray-700">Dia da Semana</label>
                <select
                  id="diaSemana"
                  name="diaSemana"
                  value={newSchedule.diaSemana}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-3 py-3"
                >
                  <option value="">Selecione o dia</option>
                  {diasDaSemana.map(dia => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="horario" className="block text-sm font-medium text-gray-700">Horário</label>
                <select
                  id="horario"
                  name="horario"
                  value={newSchedule.horario}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-3 py-3"
                >
                  <option value="">Selecione o horário</option>
                  {horariosOpcoes.map(horario => (
                    <option key={horario} value={horario}>{horario}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="local" className="block text-sm font-medium text-gray-700">Local</label>
                <select
                  id="local"
                  name="local"
                  value={newSchedule.local}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-3 py-3"
                >
                  <option value="">Selecione o local</option>
                  {locaisOpcoes.map(local => (
                    <option key={local} value={local}>{local}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-success px-6 py-2 text-white font-semibold shadow-sm transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Adicionar
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Horários Cadastrados</h2>
          {schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-lg text-gray-800">
                      <FontAwesomeIcon icon={faFutbol} className="mr-2 text-yellow-500" />
                      {schedule.categoria}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} /> {schedule.diaSemana} - {schedule.horario}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> {schedule.local}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="mt-4 sm:mt-0 ml-0 sm:ml-4 flex items-center px-4 py-2 rounded-md bg-red-500 text-white font-medium text-sm shadow hover:bg-red-600 transition-all"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-center">Nenhum horário cadastrado.</p>
          )}
        </div>
      </div>

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
