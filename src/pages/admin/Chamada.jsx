import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Chamada() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const navigate = useNavigate();

  const categorias = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15"]; 

  // Mudar formato da data
  const today = new Date();
  const dataParaDB = today.toISOString().split('T')[0]; 

  // Formatar data br
  const formatarDataBR = (dataIso) => {
    if (!dataIso) return 'N/A';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`; 
  };

  useEffect(() => {
    if (!categoriaSelecionada) {
      setAlunos([]);
      setMensagemSucesso('');
      setMensagemErro('');
      return;
    }

    async function buscarAlunos() {
      setLoading(true);
      setMensagemSucesso('');
      setMensagemErro('');
      try {
        const q = query(collection(db, 'alunos'), where('categoria', '==', categoriaSelecionada));
        const querySnapshot = await getDocs(q);

        const lista = querySnapshot.docs.map(doc => {
          const dados = doc.data();
          const presencas = dados.presencas || [];
          //  dataParaDB uso para buscar a presença do dia
          const presencaHoje = presencas.find(p => p.data === dataParaDB);
          return {
            id: doc.id,
            nome: dados.nome,
            idade: dados.idade,
            presencaHoje: presencaHoje ? presencaHoje.presente : false,
          };
        });

        setAlunos(lista);
        if (lista.length === 0) {
          setMensagemErro('Nenhum aluno encontrado para esta categoria.');
        } else {
          setMensagemSucesso(`Alunos carregados. Marque as presenças para hoje (${formatarDataBR(dataParaDB)})`);
        }
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
        setMensagemErro('Erro ao carregar alunos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    buscarAlunos();
  }, [categoriaSelecionada, dataParaDB]); 

  function togglePresenca(id) {
    setAlunos(alunos.map(aluno =>
      aluno.id === id ? { ...aluno, presencaHoje: !aluno.presencaHoje } : aluno
    ));
    setMensagemSucesso('');
    setMensagemErro('');
  }

  async function salvarPresencas() {
    setLoading(true);
    setMensagemSucesso('');
    setMensagemErro('');
    try {
      for (const aluno of alunos) {
        const alunoRef = doc(db, 'alunos', aluno.id);
        const docSnap = await getDoc(alunoRef);
        let presencas = [];
        if (docSnap.exists()) {
          presencas = docSnap.data().presencas || [];
        }

        const presencaIndex = presencas.findIndex(p => p.data === dataParaDB); 
        if (presencaIndex >= 0) {
          presencas[presencaIndex] = { data: dataParaDB, presente: aluno.presencaHoje };
        } else {
          presencas.push({ data: dataParaDB, presente: aluno.presencaHoje });
        }

        await updateDoc(alunoRef, { presencas });
      }
      setMensagemSucesso('Presenças salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar presenças:', error);
      setMensagemErro('Erro ao salvar presenças: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-dark mb-6 text-center">
          Chamada - Marcar Presença
        </h1>

        <div className="mb-6">
          <label htmlFor="categoria" className="mb-2 block text-sm font-medium text-text">
            Selecione a categoria:
          </label>
          
          <select
            id="categoria"
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 bg-white focus:ring-opacity-50 text-text"
            required
          >
            <option value="">-- Selecione --</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-lg text-text">Carregando alunos...</p>
        ) : (
          <div>
            {mensagemSucesso && (
              <p className="mb-4 text-center text-success text-sm">{mensagemSucesso}</p>
            )}
            {mensagemErro && (
              <p className="mb-4 text-center text-error text-sm">{mensagemErro}</p>
            )}

            {alunos.length === 0 && categoriaSelecionada && !mensagemErro && (
              <p className="text-center text-lg text-text">Nenhum aluno encontrado para esta categoria.</p>
            )}

            {alunos.length > 0 && (
              <div className="rounded-md p-0 mb-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-dark mb-4">Lista de Alunos ({categoriaSelecionada})</h3>
                <ul className="space-y-3">
                  {alunos.map(aluno => (
                    <li key={aluno.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                      <label className="flex items-center space-x-2 cursor-pointer text-text text-base font-medium">
                        <input
                          type="checkbox"
                          checked={aluno.presencaHoje}
                          onChange={() => togglePresenca(aluno.id)}
                          className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary focus:ring-opacity-50 border-gray-400"
                        />
                        <span>{aluno.nome} - <span className="text-gray-600 font-normal">{aluno.idade} anos</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-text shadow-sm transition duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75"
          >
            Voltar
          </button>
          {alunos.length > 0 && (
            <button
              onClick={salvarPresencas}
              disabled={loading}
              className={`rounded-md px-3 py-3 text-lg font-semibold text-white shadow-sm transition duration-300 ease-in-out
                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75'}`}
            >
              {loading ? 'Salvando...' : 'Salvar Presenças'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}