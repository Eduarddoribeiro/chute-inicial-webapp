import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faEnvelope, faPhone, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import FeedbackModal from "../../../src/components/FeedbackModal";

export default function ParentProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setFeedbackModal({ show: true, message: 'Usuário não autenticado. Redirecionando...', type: 'error' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setEditedData(data);
        } else {
          setFeedbackModal({ show: true, message: 'Dados de perfil não encontrados. Contate o suporte.', type: 'error' });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
        setFeedbackModal({ show: true, message: "Erro ao carregar seu perfil. Tente novamente.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [navigate]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (Object.keys(editedData).length === 0) {
      setFeedbackModal({ show: true, message: "Nenhuma alteração para salvar.", type: "info" });
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'usuarios', auth.currentUser.uid);
      await updateDoc(userRef, editedData);
      setProfileData(editedData); // Atualiza o estado de visualização com os dados editados
      setIsEditing(false);
      setFeedbackModal({ show: true, message: "Perfil atualizado com sucesso!", type: "success" });
    } catch (error) {
      console.error("Erro ao salvar o perfil:", error);
      setFeedbackModal({ show: true, message: "Erro ao salvar o perfil. Tente novamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <p className="text-xl text-gray-700">Carregando perfil...</p>
      </div>
    );
  }

  // Se houver um erro, exibe a modal de feedback em tela cheia
  if (feedbackModal.show && feedbackModal.type === "error" && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:ml-64 pt-20 lg:pt-24">
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center md:px-8 lg:px-12 sm:ml-64 pt-20 lg:pt-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
        {isEditing ? 'Editar Perfil' : 'Meu Perfil'}
      </h1>
      
      {profileData ? (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {isEditing ? (
            // Modo de Edição
            <form onSubmit={handleSave}>
              <div className="flex flex-col gap-4">
                <fieldset className="space-y-4">
                  <legend className="text-lg font-semibold text-gray-800 px-0">Dados do Responsável</legend>
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={editedData.nome || ''}
                      onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editedData.email || ''}
                      onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                      disabled 
                    />
                  </div>
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      value={editedData.telefone || ''}
                      onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-opacity-50 pl-3"
                    />
                  </div>
                </fieldset>
                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                  <button
                    type="submit"
                    className="rounded-md bg-yellow-500 px-6 py-3 text-lg font-semibold text-white shadow-sm transition duration-300 ease-in-out hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 sm:w-auto w-full"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setEditedData(profileData); }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 sm:w-auto w-full"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // Modo de Visualização
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {profileData.nome || 'Nome não informado'}
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 text-base">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-500" />
                  <p>
                    <strong>E-mail:</strong> {profileData.email}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FontAwesomeIcon icon={faPhone} className="text-gray-500" />
                  <p>
                    <strong>Telefone:</strong> {profileData.telefone || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white font-semibold rounded-full shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-all"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2" />
                  Editar Perfil
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center">
          <p className="text-lg text-gray-700 font-medium">Nenhum dado de perfil disponível.</p>
        </div>
      )}
      
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
