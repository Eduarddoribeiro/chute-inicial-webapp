import { useState, useEffect, useCallback } from 'react';
import { doc, collection, query, where, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '../../components/FeedbackModal';

export default function Pagamentos() {
  const [responsavel, setResponsavel] = useState(null);
  const [pagamentosPendentes, setPagamentosPendentes] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: '',
    type: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setMensagem('Usuário não autenticado. Redirecionando para o login...');
      setTimeout(() => navigate('/'), 2000);
      setLoadingDados(false);
      return;
    }

    const unsubResponsavel = onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setResponsavel(docSnap.data());
      } else {
        setMensagem('Dados do responsável não encontrados. Por favor, contate o suporte.');
      }
      setLoadingDados(false);
    }, (error) => {
      console.error('Erro ao buscar dados do responsável:', error);
      setMensagem('Erro ao carregar seus dados. Tente novamente mais tarde.');
      setLoadingDados(false);
    });

    const pagamentosQuery = query(
      collection(db, 'pagamentos'),
      where('responsavelId', '==', user.uid),
      where('status', '==', 'pendente')
    );

    const unsubPagamentos = onSnapshot(pagamentosQuery, async (querySnapshot) => {
      const pagamentosData = [];

      for (const docSnap of querySnapshot.docs) {
        const pagamentoData = docSnap.data();
        const alunoId = pagamentoData.alunoId;
        let alunoNome = '';

        try {
          const alunoDoc = await getDoc(doc(db, 'alunos', alunoId));
          if (alunoDoc.exists()) {
            alunoNome = alunoDoc.data().nome || '';
          }
        } catch (error) {
          console.error('Erro ao buscar nome do aluno:', error);
        }

        pagamentosData.push({ id: docSnap.id, alunoNome, ...pagamentoData });
      }

      setPagamentosPendentes(pagamentosData);
    }, (error) => {
      console.error('Erro ao buscar pagamentos pendentes:', error);
      setMensagem('Erro ao carregar os pagamentos. Tente novamente mais tarde.');
    });

    return () => {
      unsubResponsavel();
      unsubPagamentos();
    };
  }, [navigate]);

  // A LÓGICA DE PAGAMENTO FOI SIMPLIFICADA PARA GERAR UM LINK
  // O link redireciona o usuário para a página de checkout do Abacate Pay.
  const handlePayment = useCallback((pagamento) => {
    const baseUrl = 'https://checkout.abacatepay.com/pay';
    
    // Constrói a URL de forma mais robusta, com parâmetros de URL
    const params = new URLSearchParams({
        valor: pagamento.valor,
        descricao: `Mensalidade - ${pagamento.alunoNome}`,
        identificador: pagamento.id
    });

    const paymentUrl = `${baseUrl}?${params.toString()}`;

    window.open(paymentUrl, '_blank');

    setFeedbackModal({
      show: true,
      message: 'Você será redirecionado para a página de pagamento. Após o pagamento, o status deve ser atualizado manualmente.',
      type: 'info',
    });

  }, []);

  const closeModal = () => {
    setFeedbackModal({ show: false, message: '', type: '' });
  };

  if (loadingDados) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <p className="text-xl text-gray-700">Carregando informações de pagamento...</p>
      </div>
    );
  }

  if (mensagem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-lg bg-red-100 p-6 shadow-md border border-red-500">
          <p className="text-xl text-red-700 text-center">{mensagem}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-md bg-blue-600 py-2 text-lg font-semibold text-white transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 flex flex-col items-center md:px-8 lg:px-12">
      {feedbackModal.show && (
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={closeModal}
        />
      )}

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-6 sm:p-8 md:p-10 lg:p-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Área de Pagamentos
        </h1>

        {pagamentosPendentes.length > 0 ? (
          <div className="space-y-6">
            {pagamentosPendentes.map(pagamento => (
              <div
                key={pagamento.id}
                className="p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center"
              >
                <div className="text-center sm:text-left mb-4 sm:mb-0">
                  <p className="text-lg font-bold text-blue-800">
                    Mensalidade de {pagamento.alunoNome}
                  </p>
                  <p className="text-base text-gray-700">
                    Mês de Referência: {pagamento.dataLancamento ? pagamento.dataLancamento.slice(0, 7) : 'Mês Indefinido'}
                  </p>
                  <p className="text-base text-gray-700">
                    Valor a ser pago: R$ {pagamento.valor.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handlePayment(pagamento)}
                  className="w-full sm:w-auto rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                >
                  Pagar com Link Pix
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm text-center">
            <p className="text-lg font-bold text-yellow-800">
              Nenhuma mensalidade pendente no momento.
            </p>
            <p className="text-base text-gray-700 mt-2">
              Se você acha que isso é um erro, por favor, entre em contato com o suporte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
