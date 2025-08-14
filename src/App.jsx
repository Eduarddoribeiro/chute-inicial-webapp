import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import ResetSenha from './pages/auth/ResetSenha';
import AdminDashboard from './pages/admin/Dashboard';
import ParentDashboard from './pages/responsavel/ParentDashboard'; 
import EditarResponsavelAluno from './pages/admin/EditarResponsavelAluno';  
import Chamada from './pages/admin/Chamada';
import CadastroResponsavelAluno from './pages/admin/CadastroResponsavelAluno';
import CriarAdminUser from './pages/admin/CriarAdminUser';
import HistoricoFrequencia from './pages/admin/HistoricoFrequencia';

import ParentLayout from './layouts/ParentLayout';
import AdminLayout from './layouts/AdminLayout';
import Pagamentos from './pages/responsavel/Pagamentos';
import LancamentoPagamentos from './pages/admin/LancamentoPagamentos';

function App() {
  return (
    <Routes>
      {/* Rotas de autenticação */}
      <Route path="/" element={<Login />} />
      <Route path="/auth/reset-senha" element={<ResetSenha />} />
            

      {/* Rotas do Admin dentro de AdminLayout */}
      {/* A rota pai /admin renderiza o AdminLayout na parte de cima e na lateral */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* As rotas filhas não precisam repetir "/admin" */}
        <Route path="dashboard" element={<AdminDashboard />} /> 
        <Route path="alunos/editar/:id" element={<EditarResponsavelAluno />} /> 
        <Route path="realizar-chamada" element={<Chamada />} /> 
        <Route path="cadastrar-responsavel-aluno" element={<CadastroResponsavelAluno />} />
        <Route path="historico-frequencia" element={<HistoricoFrequencia />} />
<Route path="lancar-mensalidades" element={<LancamentoPagamentos />} />
        {/* A rota filha só precisa do final do caminho */}
        <Route path="criar-admin" element={<CriarAdminUser />} /> 
        
      </Route>
      
      {/* Rotas de Responsável dentro de ParentLayout */}
      {/* Agora, o ParentDashboard é uma rota filha de ParentLayout */}
      <Route path="/responsavel" element={<ParentLayout />}>
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="pagamentos" element={<Pagamentos />}/>
      </Route>
    </Routes>
  );
}

export default App;
