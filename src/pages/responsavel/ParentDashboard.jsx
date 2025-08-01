import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const [responsavel, setResponsavel] = useState(null);
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setMensagem('');
      const user = auth.currentUser;
      if (!user) {
        setMensagem('Usuário não autenticado. Redirecionando para o login...');
        setTimeout(() => navigate('/'), 2000);
        setLoading(false);
        return;
      }

      try {
        const responsavelRef = doc(db, 'usuarios', user.uid);
        const responsavelSnap = await getDoc(responsavelRef);

        if (!responsavelSnap.exists()) {
          setMensagem('Dados do responsável não encontrados. Por favor, contate o suporte.');
          setLoading(false);
          return;
        }

        const responsavelData = responsavelSnap.data();
        setResponsavel(responsavelData);

        if (responsavelData.alunoId) {
          const alunoRef = doc(db, 'alunos', responsavelData.alunoId);
          const alunoSnap = await getDoc(alunoRef);

          if (alunoSnap.exists()) {
            setAluno({ id: alunoSnap.id, ...alunoSnap.data() }); 
          } else {
            setMensagem('Aluno vinculado não encontrado no sistema. Por favor, contate o suporte.');
          }
        } else {
          setMensagem('Nenhum aluno vinculado à sua conta. Por favor, contate o suporte para vincular um aluno.');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMensagem('Erro ao carregar seus dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  //  formatar a data 
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray p-4">
        <p className="text-xl text-text">Carregando dados do painel...</p>
      </div>
    );
  }

  if (mensagem && !responsavel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray p-4">
        <div className="w-full max-w-md rounded-lg bg-red-100 p-6 shadow-md border border-error">
          <p className="text-xl text-error text-center">{mensagem}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-md bg-primary py-2 text-lg font-semibold text-white transition duration-300 ease-in-out hover:bg-error focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray px-4 py-8 flex flex-col items-center md:px-8 lg:px-12">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-6 sm:p-8 md:p-10 lg:p-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-8 text-center">
          Área do Aluno
        </h1>

        {responsavel && (
          <div className="mb-8 border border-gray-200 p-6 rounded-lg shadow-sm bg-blue-50">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4">Seus Dados</h2>
            <div className="space-y-2 text-text text-base">
              <p><strong>Nome:</strong> {responsavel.nome}</p>
              <p><strong>Email:</strong> {responsavel.email}</p>
              <p><strong>Telefone:</strong> {responsavel.telefone}</p>
            </div>
          </div>
        )}

        {aluno ? (
          <>
            <div className="mb-8 border border-gray-200 p-6 rounded-lg shadow-sm bg-green-50">
              <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4">Dados do Aluno Vinculado</h2>
              <div className="space-y-2 text-text text-base">
                <p><strong>Nome:</strong> {aluno.nome}</p>
                {/*formatar data dataNascimento */}
                <p><strong>Data de Nascimento:</strong> {formatarData(aluno.dataNascimento)}</p>
                <p><strong>Idade:</strong> {aluno.idade} anos</p>
                <p><strong>Categoria:</strong> {aluno.categoria}</p>
                <p><strong>Número da Camisa:</strong> {aluno.numeroCamisa || 'Não informado'}</p>
              </div>
            </div>

            <div className="mb-8 border border-gray-200 p-6 rounded-lg shadow-sm bg-purple-50">
              <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-4">Histórico de Chamadas</h2>
              {aluno.presencas && aluno.presencas.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200"> 
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-text uppercase tracking-wider whitespace-nowrap">Data</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-text uppercase tracking-wider whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...aluno.presencas].sort((a, b) => new Date(b.data) - new Date(a.data)).map((presenca, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-text whitespace-nowrap">{formatarData(presenca.data)}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${presenca.presente ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                              {presenca.presente ? 'Presente' : 'Ausente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text text-base">Nenhum registro de chamada encontrado para este aluno.</p>
              )}
            </div>
          </>
        ) : (
          <div className="mb-8 border border-gray-200 p-6 rounded-lg shadow-sm bg-yellow-50">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-800 mb-4">Status do Aluno</h2>
            <p className="text-text text-base">{mensagem}</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => alert('Em breve: Mais funcionalidades para responsáveis!')}
            className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white transition duration-300 ease-in-out hover:bg-error focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75"
          >
            Explorar Outras Opções
          </button>
        </div>
      </div>
    </div>
  );
}