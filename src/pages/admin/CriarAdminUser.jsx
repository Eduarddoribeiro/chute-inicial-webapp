import { useState } from 'react';
import { auth, db } from '../../firebase/config'; // Ajuste o caminho conforme seu projeto
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function CriarAdminUser() {
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCriarAdmin = async (e) => {
    e.preventDefault();
    setMensagem('');
    setErro('');
    setLoading(true);

    try {
      if (!adminName.trim() || !email.trim() || !senha.trim()) {
        setErro('Por favor, preencha todos os campos obrigatórios (Nome, E-mail, Senha).');
        setLoading(false);
        return;
      }

      // 1. Criar o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2. Salvar as informações da role no Firestore
      // A coleção 'usuarios' é onde você já armazena as roles
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: adminName, // AQUI: Usamos o novo estado 'adminName'
        email: user.email,
        role: 'admin',
        createdAt: new Date(),
      });

      setMensagem(`Usuário admin "${email}" criado e role definida com sucesso!`);
      // Limpar campos após sucesso
      setAdminName('');
      setEmail('');
      setSenha('');
    } catch (error) {
      console.error("Erro ao criar usuário admin:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        setErro('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setErro(`Erro: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Criar Usuário Admin</h2>
        
         <form onSubmit={handleCriarAdmin} className="space-y-4">
          <div>
            <label htmlFor="adminName" className="mb-1 block text-sm font-medium text-gray-700">Nome do Admin</label>
            <input
              type="text" 
              id="adminName" 
              placeholder="Nome completo do administrador"
              value={adminName} 
              onChange={(e) => setAdminName(e.target.value)} 
              className="w-full rounded-md border border-gray-300 p-2"
              required
            />
          </div>

          <div> 
            <label htmlFor="emailAdmin" className="mb-1 block text-sm font-medium text-gray-700">E-mail do Admin</label>
            <input
              type="email"
              id="emailAdmin" 
              placeholder="admin@exemplo.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="senhaAdmin" className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              id="senhaAdmin"
              placeholder="********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-lg font-semibold text-white transition duration-300 ease-in-out hover:bg-error focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : 'Criar Admin'}
          </button>
        </form>

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
      </div>
    </div>
  );
}

export default CriarAdminUser; 