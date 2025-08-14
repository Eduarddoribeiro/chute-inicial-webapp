import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc,
  documentId,
  arrayRemove, 
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

import FeedbackModal from "../../../src/components/FeedbackModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserGroup,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function AdminDashboard() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const navigate = useNavigate();

  const categorias = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15"];

  const [totalAlunos, setTotalAlunos] = useState(0);
  const [alunosPorCategoria, setAlunosPorCategoria] = useState({});

  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [alunoParaExcluir, setAlunoParaExcluir] = useState(null);

  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // armazena os dados dos responsáveis
  const [responsaveisMap, setResponsaveisMap] = useState({});

  // busca alunos e seus responsáveis 
  const fetchAlunosAndResponsaveis = async () => {
    try {
      const alunosQuerySnapshot = await getDocs(collection(db, "alunos"));
      let listaAlunos = alunosQuerySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Coleta IDs únicos dos responsáveis
      const responsavelIds = [
        ...new Set(
          listaAlunos.map((aluno) => aluno.responsavelId).filter(Boolean)
        ),
      ];

      const fetchedResponsaveis = {};
      // Consulta os responsáveis apenas se houver IDs para buscar
      if (responsavelIds.length > 0) {

        const responsaveisQuerySnapshot = await getDocs(
          query(
            collection(db, "usuarios"),
            where(documentId(), "in", responsavelIds)
          )
        );
        responsaveisQuerySnapshot.docs.forEach((doc) => {
          fetchedResponsaveis[doc.id] = doc.data();
        });
      }
      setResponsaveisMap(fetchedResponsaveis);

      // Adiciona os dados do responsável a cada aluno
      listaAlunos = listaAlunos.map((aluno) => ({
        ...aluno,
        responsavelData: fetchedResponsaveis[aluno.responsavelId] || null, // Adiciona os dados do responsável
      }));

      listaAlunos.sort((a, b) => a.nome.localeCompare(b.nome));
      setAlunos(listaAlunos);
    } catch (error) {
      console.error("Erro ao buscar alunos e responsáveis:", error);
      setFeedbackModal({
        show: true,
        message:
          "Erro ao carregar lista de alunos e responsáveis. Tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true); 
    fetchAlunosAndResponsaveis();
  }, []); 

  useEffect(() => {
    let listaFiltrada = [...alunos];

    if (filtroNome) {
      listaFiltrada = listaFiltrada.filter((aluno) =>
        aluno.nome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    if (filtroCategoria) {
      listaFiltrada = listaFiltrada.filter(
        (aluno) => aluno.categoria === filtroCategoria
      );
    }

    listaFiltrada.sort((a, b) => a.nome.localeCompare(b.nome));

    setAlunosFiltrados(listaFiltrada);

    setTotalAlunos(alunos.length);

    const contagemPorCategoria = {};
    categorias.forEach((cat) => {
      contagemPorCategoria[cat] = alunos.filter(
        (aluno) => aluno.categoria === cat
      ).length;
    });
    setAlunosPorCategoria(contagemPorCategoria);
  }, [alunos, filtroNome, filtroCategoria]);

  const handleOpenConfirmacaoExclusao = (aluno) => {
    setAlunoParaExcluir(aluno);
    setConfirmarExclusao(true);
  };

  async function handleExcluirAlunoConfirmado() {
    if (!alunoParaExcluir) return;

    setConfirmarExclusao(false); // Fecha o modal de confirmação
    setLoading(true); // Ativa loading

    try {
      // remove o aluno da coleção alunos
      await deleteDoc(doc(db, "alunos", alunoParaExcluir.id));

      // remove o alunoId do array alunoIds do responsável, se o responsável existir
      if (alunoParaExcluir.responsavelId) {
        const responsavelDocRef = doc(
          db,
          "usuarios",
          alunoParaExcluir.responsavelId
        );
        const responsavelDocSnap = await getDoc(responsavelDocRef); 

        if (responsavelDocSnap.exists()) {
    
          await updateDoc(responsavelDocRef, {
            alunoIds: arrayRemove(alunoParaExcluir.id),
          });
        } else {
    
          console.warn(
            `Aviso: Documento do responsável ${alunoParaExcluir.responsavelId} não encontrado na coleção 'usuarios'. O alunoId não pôde ser removido do array de alunos do responsável.`
          );
            }
      }

      setFeedbackModal({
        show: true,
        message: `Aluno ${alunoParaExcluir.nome} excluído.`, 
        type: "success",
      });

      await fetchAlunosAndResponsaveis();
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
      setFeedbackModal({
        show: true,
        message: "Erro ao excluir aluno: " + error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
      setAlunoParaExcluir(null);
    }
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-xl text-gray-700">Carregando alunos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto lg:max-w-full xl:max-w-screen-xl pt-10 md:pt-0">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Gestão de alunos
        </h1>

        {/*botões de ação*/}
        <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/admin/cadastrar-responsavel-aluno")}
            className="rounded-md bg-yellow-500 hover:bg-yellow-700  px-6 py-3 text-lg font-semibold text-white transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75"
          >
            + Cadastrar Novo Aluno
          </button>
          <button
            onClick={() => navigate("/admin/realizar-chamada")}
            className="rounded-md bg-success px-6 py-3 text-lg font-semibold text-white transition duration-300 ease-in-out hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-success focus:ring-opacity-75"
          >
            Realizar Chamadas
          </button>
        </div>

        {/* Estatísticas */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200 hidden md:block">
          <h2 className="text-xl font-bold text-dark mb-4 text-center">
            Visão Geral dos Alunos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">


            {/* Card Total de alunos*/}
            <div className="relative border border-gray-200 rounded-2xl p-4 transition-all duration-200 hover:shadow-md">
              <div className="mb-6">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900"
                />
              </div>
              <h4 className="text-base font-semibold text-dark mb-2 capitalize transition-all duration-500">
                Total de Alunos
              </h4>{" "}
              
              <p className="text-3xl font-bold text-b">{totalAlunos}</p>{" "}
              
            </div>

            {/* Cards categorias do aluno*/}
            {categorias.map((cat) => (
              <div
                key={cat}
                className="relative border border-gray-200 rounded-2xl p-4 transition-all duration-200 hover:shadow-md"
              >
                <div className="mb-6">
                  <FontAwesomeIcon
                    icon={faUserGroup}
                    className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900"
                  />
                </div>
                <h4 className="text-base font-semibold text-dark mb-2 capitalize transition-all duration-500">
                  Alunos {cat}
                </h4>{" "}
                <p className="text-3xl font-bold text-success">
                  {alunosPorCategoria[cat] || 0}
                </p>{" "}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
            Lista de Alunos
          </h2>

          {/* filtros */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
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
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full sm:w-1/3 rounded-md border border-gray-300 p-2 bg-white focus:ring-blue-500 focus:border-blue-500 text-gray-700
             h-10 leading-normal placeholder-gray-400
             appearance-none bg-no-repeat bg-right pr-8" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundPosition:
                  "right 0.75rem center",
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
          </div>

          {alunosFiltrados.length === 0 ? (
            <p className="p-4 text-center text-lg text-gray-600">
              {" "}
              Nenhum aluno encontrado com os filtros aplicados.
            </p>
          ) : (
            <div className="relative overflow-x-auto">
              {" "}
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                    >
                      Nome
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell whitespace-nowrap"
                    >
                      Idade
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
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell whitespace-nowrap"
                    >
                      Telefone Responsável
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="border-b hover:bg-gray-50">
                      <th
                        scope="row"
                        className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap font-medium text-left"
                      >
                        <div className="ps-0">
                          <div className="text-base font-semibold text-gray-900">
                            {aluno.nome}
                          </div>
                          <div className="font-normal text-gray-500">
                            {aluno.responsavelData?.email || "N/A"}
                          </div>
                        </div>
                      </th>
                      <td className="px-6 py-4 text-gray-700 hidden sm:table-cell whitespace-nowrap text-left">
                        {aluno.idade} anos
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap text-left">
                        {aluno.categoria}
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap text-left">
                        {aluno.responsavelData?.nome || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700 hidden lg:table-cell whitespace-nowrap">
                        {aluno.responsavelData?.telefone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
  <Link
    to={`/admin/alunos/editar/${aluno.id}`}
    className="text-blue-600 hover:text-blue-800 mr-3"
  >
    <FontAwesomeIcon icon={faPen} />
  </Link>
  <button
    onClick={() => handleOpenConfirmacaoExclusao(aluno)}
    className="text-red-600 hover:text-red-800"
  >
    <FontAwesomeIcon icon={faTrash} />
  </button>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* modal- confirmação-exclusão */}
        {confirmarExclusao && alunoParaExcluir && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-md max-h-full">
              <div className="relative bg-white rounded-lg shadow">
                <button
                  type="button"
                  className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                  onClick={() => setConfirmarExclusao(false)}
                >
                  <svg
                    className="w-5 h-5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="p-6 text-center">
                  <svg
                    className="mx-auto mb-4 text-gray-400 w-12 h-12"
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
                      d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <h3 className="mb-5 text-lg font-normal text-gray-500">
                    Tem certeza que deseja excluir o aluno{" "}
                    <span className="font-semibold text-gray-800">
                      {alunoParaExcluir?.nome}
                    </span>
                    ?
                  </h3>
                  <button
                    onClick={handleExcluirAlunoConfirmado}
                    type="button"
                    className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
                  >
                    Sim, tenho certeza
                  </button>
                  <button
                    onClick={() => setConfirmarExclusao(false)}
                    type="button"
                    className="text-gray-500 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                  >
                    Não, cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Feedback modal */}
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
    </div>
  );
}
