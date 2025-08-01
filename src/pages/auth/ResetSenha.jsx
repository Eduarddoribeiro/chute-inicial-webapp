import { useState } from 'react';
import { auth } from '../../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; 

export default function ResetSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate(); 

  const handleReset = async () => {
    setMensagem('');
    setErro('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMensagem('E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err) {
      console.error("Erro ao enviar e-mail de redefinição:", err);
      // Mensagens de erro
      if (err.code === 'auth/user-not-found') {
        setErro('E-mail não encontrado. Verifique e tente novamente.');
      } else if (err.code === 'auth/invalid-email') {
        setErro('Formato de e-mail inválido.');
      } else {
        setErro('Erro ao enviar e-mail. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Redefinir Senha</h2>

        <p className="mb-4 text-center text-gray-600 text-sm">
          Digite seu e-mail para receber um link de redefinição de senha.
        </p>

        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">E-mail</label>
          <input
            type="email"
            id="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            required
          />
        </div>

        <button
          onClick={handleReset}
          className="w-full rounded-md bg-primary py-3 text-lg font-semibold text-white transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Enviar link de redefinição
        </button>

        {mensagem && (
          <p className="mt-4 text-center text-sm text-green-600">
            {mensagem}
          </p>
        )}
        {erro && (
          <p className="mt-4 text-center text-sm text-red-600">
            {erro}
          </p>
        )}

        <p
          className="mt-6 cursor-pointer text-center text-blue-600 hover:text-blue-800 hover:underline"
          onClick={() => navigate('/')} // volta para a rota de login
        >
          Voltar para o Login
        </p>
      </div>
    </div>
  );
}