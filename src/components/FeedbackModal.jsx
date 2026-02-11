import React from 'react';

export default function FeedbackModal({ message, type, onClose }) {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-white' : 'bg-red-100';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const borderColor = isSuccess ? 'border-green-800' : 'border-red-400';
 
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600'; 

  const iconPath = isSuccess
 
    ? "M10 .5C4.75 0 0 4.75.5 10c.5 5.25 4.75 10 10 9.5 5.25-.5 10-4.75 9.5-10C19.25 4.75 14.25 0 10 .5Zm-.25 13.5a.75.75 0 0 1-1.06-.06l-2.75-2.75a.75.75 0 0 1 1.06-1.06l2.22 2.22 4.56-4.56a.75.75 0 0 1 1.06 1.06l-5.12 5.12Z"
    
    : "M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`relative w-full max-w-sm rounded-lg shadow-xl p-6 text-center ${bgColor} border ${borderColor}`}>
        {/* Botão de Fechar */}
        <button 
          type="button" 
          className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" 
          onClick={onClose}
        >
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
          <span className="sr-only">Close modal</span>
        </button>

        <svg className={`mx-auto mb-4 ${iconColor} w-12 h-12`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" 
             fill={isSuccess ? "currentColor" : "none"}
             viewBox="0 0 20 20">
            <path stroke={isSuccess ? "none" : "currentColor"}
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}/>
        </svg>

        {/* Mensagem */}
        <h3 className={`mb-5 text-lg font-normal ${textColor}`}>{message}</h3>
        
        {/* Botão de Ok/Fechar */}
        <button 
            onClick={onClose} 
            type="button" 
            className={`text-white ${isSuccess ? 'bg-green-600 hover:bg-green-800 focus:ring-green-300' : 'bg-red-600 hover:bg-red-800 focus:ring-red-300'} focus:ring-4 focus:outline-none font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center`}
        >
            Ok
        </button>
      </div>
    </div>
  );
}