import React, { useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from '../../firebase/config';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LancamentoPagamentos() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    type: "",
  });

  const handleLancarPagamentos = async () => {
    setLoading(true);
    setFeedback({ show: false, message: "", type: "" });

    try {
      // 1. Obter todos os alunos
      const alunosCollection = collection(db, "alunos");
      const alunosSnapshot = await getDocs(alunosCollection);
      const alunos = alunosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (alunos.length === 0) {
        setFeedback({
          show: true,
          message: "Nenhum aluno encontrado para lançar pagamentos.",
          type: "info",
        });
        setLoading(false);
        return;
      }

      // 2. Definir dados do pagamento
      const valorMensalidade = 80.0;
      const dataVencimento = new Date(); 
      const pagamentosCollection = collection(db, "pagamentos");

      // 3. Criar um novo documento de pagamento para cada aluno
      const lancamentosPromises = alunos.map((aluno) =>
        addDoc(pagamentosCollection, {
          alunoId: aluno.id,
          responsavelId: aluno.responsavelId || "N/A", // Assume que o aluno tem um responsavelId
          valor: valorMensalidade,
          dataVencimento: dataVencimento.toISOString().split('T')[0],
          status: "pendente",
          dataLancamento: new Date().toISOString().split('T')[0],
        })
      );

      await Promise.all(lancamentosPromises);

      setFeedback({
        show: true,
        message: `Pagamentos lançados com sucesso para ${alunos.length} alunos!`,
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao lançar pagamentos:", error);
      setFeedback({
        show: true,
        message: "Ocorreu um erro ao lançar os pagamentos. Tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-xl">
        <h1 className="mb-6 text-3xl font-extrabold text-center text-gray-900">
          Lançar Mensalidades
        </h1>

        <p className="mb-8 text-center text-gray-700">
          Clique no botão abaixo para lançar a mensalidade padrão de R$ 80,00 para todos os alunos.
        </p>

        {feedback.show && (
          <div
            className={`p-4 mb-6 text-sm rounded-lg ${
              feedback.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleLancarPagamentos}
            disabled={loading}
            className={`flex items-center justify-center px-6 py-3 text-lg font-semibold text-white rounded-md transition-colors duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
            }`}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Lançando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2" />
                Lançar Mensalidades
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
