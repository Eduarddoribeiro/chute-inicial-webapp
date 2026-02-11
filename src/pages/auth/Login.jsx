import { useState } from 'react';
import { auth, db } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import LogoEscolinha from '../../assets/logo.svg';
import LoginBackground from '../../assets/login-image.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErro('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      console.log('Usuário logado:', user.uid);

      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setErro('Usuário não encontrado no banco de dados');
        return;
      }

      const userData = userDocSnap.data();
      console.log('Dados do usuário:', userData);

  
      if (userData.role === 'responsavel') {
        if (!userData.alunoIds || userData.alunoIds.length === 0) {
          setErro('Nenhum aluno vinculado a este responsável.');
          return;
        }


        console.log('IDs dos alunos vinculados:', userData.alunoIds);


        const primeiroAlunoId = userData.alunoIds[0].trim();
        const alunoDocRef = doc(db, 'alunos', primeiroAlunoId);
        const alunoDocSnap = await getDoc(alunoDocRef);

        if (!alunoDocSnap.exists()) {
          setErro('O primeiro aluno vinculado não existe no banco de dados');
          return;
        }

        const alunoData = alunoDocSnap.data();
        console.log('Dados do primeiro aluno vinculado:', alunoData);
      }

      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'responsavel') {
        navigate('/responsavel/dashboard');
      } else {
        setErro('Perfil de usuário desconhecido');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      if (err.code === 'auth/invalid-email') {
        setErro('Formato de e-mail inválido.');
      } else if (err.code === 'auth/user-disabled') {
        setErro('Este usuário foi desativado.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErro('E-mail ou senha inválidos.');
      } else {
        setErro('Erro no login. Tente novamente.');
      }
    }
  };

return (
    <div className="flex min-h-screen md:flex-row p-4 sm:p-6 md:p-0">
      
      <div className="w-full md:w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8 sm:p-10 md:p-12 lg:p-16">

        <div className="w-full sm:max-w-sm mx-auto">
          <img src={LogoEscolinha} alt="Logo Escolinha Chute Inicial" className="mx-auto h-16 w-auto" />
          <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-dark md:text-3xl">Faça o seu login</h2>
          <p className="mt-2 font-medium text-center text-sm text-gray-600">Seja bem-vindo(a)!</p>
        </div>

        <div className="mt-10 w-full sm:max-w-sm mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text">Email</label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-2 text-text shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-text">Senha</label>
                <div className="text-sm">
                  <a href="#" onClick={() => navigate('/auth/reset-senha')} className="font-semibold text-primary hover:text-error">Esqueceu a senha?</a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-2 text-text shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Entrar
              </button>
            </div>

            <div className="bg-gray-100 p-3 rounded-md text-center border border-gray-200">
                <p className="text-xs text-gray-500 font-bold mb-1">DADOS DE ACESSO (DEMO):</p>
                <p className="text-sm text-gray-700">Email: <span className="font-mono">admin@teste.com</span></p>
                <p className="text-sm text-gray-700">Senha: <span >chuteinicial123</span></p>
            </div>

          </form>

          {erro && (
            <p className="mt-4 text-center text-sm text-error">
              {erro}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Não possui uma conta?
            <a href="#" className="font-semibold text-primary hover:text-error ml-1">Contate o Administrador</a>
          </p>
        </div>
      </div>

      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${LoginBackground})` }}
      >
      </div>
    </div>
  );
}
