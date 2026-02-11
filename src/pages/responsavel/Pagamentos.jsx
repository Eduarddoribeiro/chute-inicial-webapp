import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faHandshake, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import FeedbackModal from "../../../src/components/FeedbackModal";

export default function ParentPayments() {
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "",
  });

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center md:px-8 lg:px-12 sm:ml-64 pt-20 lg:pt-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
        Pagamentos
      </h1>

      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <FontAwesomeIcon icon={faHandshake} className="text-blue-500 text-6xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">
            Funcionalidade em Desenvolvimento
          </h2>
          <p className="text-gray-700 text-base">
            Estamos trabalhando para trazer a área de pagamentos para você. Em breve, você poderá visualizar boletos e histórico de pagamentos por aqui.
          </p>
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
