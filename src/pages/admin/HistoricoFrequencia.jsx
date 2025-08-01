import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";

import FeedbackModal from "../../../src/components/FeedbackModal"; 

export default function HistoricoFrequencia() {
  const [alunosComFrequencia, setAlunosComFrequencia] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [frequenciasFiltradas, setFrequenciasFiltradas] = useState([]);

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const navigate = useNavigate();

  const categorias = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15"];

  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return "N/A";
    const dataObj = new Date(dataIso);
    if (isNaN(dataObj.getTime())) {
      return "Data Inválida";
    }
    const dia = String(dataObj.getDate()).padStart(2, "0");
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0"); // mês é 0-indexed
    const ano = dataObj.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    async function fetchAlunosComFrequenciaEresponsaveis() {
      setLoading(true);
      setFeedbackModal({ show: false, message: "", type: "" }); // Limpa mensagens anteriores
      try {
        const alunosSnapshot = await getDocs(collection(db, "alunos"));
        const listaAlunos = alunosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Coleta todos os IDs de responsáveis únicos dos alunos
        const responsavelIds = [
          ...new Set(
            listaAlunos.map((aluno) => aluno.responsavelId).filter(Boolean)
          ),
        ];

        const responsaveisMap = {};
        if (responsavelIds.length > 0) {
          const responsaveisSnapshot = await getDocs(
            query(
              collection(db, "usuarios"),
              where(documentId(), "in", responsavelIds)
            )
          );
          responsaveisSnapshot.docs.forEach((doc) => {
            responsaveisMap[doc.id] = doc.data();
          });
        }

        const todosRegistrosFrequencia = [];
        listaAlunos.forEach((aluno) => {
          if (
            aluno.presencas &&
            Array.isArray(aluno.presencas) &&
            aluno.presencas.length > 0
          ) {
            // Verificar se é um array
            const responsavelData = responsaveisMap[aluno.responsavelId]; 
            const responsavelNome = responsavelData
              ? responsavelData.nome
              : "N/A"; 
            aluno.presencas.forEach((presenca) => {
              todosRegistrosFrequencia.push({
                alunoId: aluno.id,
                alunoNome: aluno.nome,
                alunoCategoria: aluno.categoria,
                responsavelNome: responsavelNome, 
                data: presenca.data, 
                presente: presenca.presente,
              });
            });
          }
        });

        todosRegistrosFrequencia.sort(
          (a, b) => new Date(b.data) - new Date(a.data)
        );
        setAlunosComFrequencia(todosRegistrosFrequencia); 
      } catch (error) {
        console.error(
          "Erro ao buscar histórico de frequência e responsáveis:",
          error
        );
        setFeedbackModal({
          show: true,
          message: "Erro ao carregar histórico de frequência. Tente novamente.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchAlunosComFrequenciaEresponsaveis();
  }, []);

  useEffect(() => {
    let listaFiltrada = [...alunosComFrequencia]; 

    if (filtroNome) {
      listaFiltrada = listaFiltrada.filter((registro) =>
        registro.alunoNome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    if (filtroCategoria) {
      listaFiltrada = listaFiltrada.filter(
        (registro) => registro.alunoCategoria === filtroCategoria
      );
    }

    if (dataInicial) {
      listaFiltrada = listaFiltrada.filter(
        (registro) => registro.data >= dataInicial
      );
    }
    if (dataFinal) {
      listaFiltrada = listaFiltrada.filter(
        (registro) => registro.data <= dataFinal
      );
    }

    setFrequenciasFiltradas(listaFiltrada);
  }, [
    alunosComFrequencia,
    filtroNome,
    filtroCategoria,
    dataInicial,
    dataFinal,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-xl text-gray-700">
          Carregando histórico de frequência...
        </p>
      </div>
    );
  }

  //  feedback para erros
  if (feedbackModal.show && feedbackModal.type === "error" && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() =>
            setFeedbackModal({ show: false, message: "", type: "" })
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto max-w-7xl bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Histórico de Frequência
        </h1>

        {/* filtro e busca */}
        <div className="pb-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* filtro busca de nome */}
            <div className="relative w-full sm:w-1/2">
              <label htmlFor="table-search-users" className="sr-only">
                Buscar
              </label>
              <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="table-search-users"
                className="block py-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-full bg-gray-50 placeholder-gray-400"
                placeholder="Buscar aluno por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>
            {/* filtros*/}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full sm:w-1/3 rounded-md border border-gray-300 p-2 bg-white focus:ring-blue-500 focus:border-blue-500 text-gray-700
             h-10 leading-normal placeholder-gray-400
             appearance-none bg-no-repeat bg-right pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "16px 12px",
              }}
            >
              <option value="">Todas as Categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="w-full sm:w-1/3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  id="dataInicial"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="block w-full sm:w-1/2 rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Data Inicial"
                  title="Data Inicial"
                />
                <input
                  type="date"
                  id="dataFinal"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="block w-full sm:w-1/2 rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Data Final"
                  title="Data Final"
                />
              </div>
            </div>
          </div>
        </div>

        {frequenciasFiltradas.length === 0 ? (
          <p className="p-4 text-center text-lg text-gray-600 bg-white rounded-b-lg shadow-md border border-gray-200">
            Nenhum registro de frequência encontrado com os filtros aplicados.
          </p>
        ) : (
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                  >
                    Aluno
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                  >
                    Categoria
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                  >
                    Responsável
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                  >
                    Data
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {frequenciasFiltradas.map((registro, index) => (
                  <tr
                    key={`${registro.alunoId}-${registro.data}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                      {registro.alunoNome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {registro.alunoCategoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {registro.responsavelNome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatarDataBR(registro.data)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          registro.presente
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {registro.presente ? "Presente" : "Ausente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75"
          >
            Voltar para Dashboard
          </button>
        </div>
      </div>
      {/* Feedback Modal */}
      {feedbackModal.show && (
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() =>
            setFeedbackModal({ show: false, message: "", type: "" })
          }
        />
      )}
    </div>
  );
}
