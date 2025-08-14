import { Routes, Route } from 'react-router-dom';

import Login from './pages/auth/Login';
import ResetSenha from './pages/auth/ResetSenha';
import AdminDashboard from './pages/admin/Dashboard';
import ParentDashboard from './pages/responsavel/ParentDashboard'; 
import Pagamentos from './pages/responsavel/Pagamentos'; 
import EditarResponsavelAluno from './pages/admin/EditarResponsavelAluno';  
import Chamada from './pages/admin/Chamada';
import CadastroResponsavelAluno from './pages/admin/CadastroResponsavelAluno';
import CriarAdminUser from './pages/admin/CriarAdminUser';
import HistoricoFrequencia from './pages/admin/HistoricoFrequencia';
import Perfil from './pages/responsavel/Perfil';
import Horarios from './pages/responsavel/Horarios';
import Treinos from './pages/admin/Treinos';
import AdminLayout from './layouts/AdminLayout';
import ParentLayout from './layouts/ParentLayout';
import LancamentoPagamentos from './pages/admin/LancamentoPagamentos';
import Frequencia from './pages/responsavel/Frequencia'



function App() {
  return (
      <Routes>
        {/* Rotas de autenticação*/}
        <Route path="/" element={<Login />} />
        <Route path="/auth/reset-senha" element={<ResetSenha />} />
        
        {/* Rotas do Admin dentro de AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} /> 
          <Route path="alunos/editar/:id" element={<EditarResponsavelAluno />} /> 
          <Route path="realizar-chamada" element={<Chamada />} /> 
          <Route path="cadastrar-responsavel-aluno" element={<CadastroResponsavelAluno />} />
          <Route path="historico-frequencia" element={<HistoricoFrequencia />} />
          <Route path="lancar-mensalidades" element={<LancamentoPagamentos />} />
          <Route path="criar-admin" element={<CriarAdminUser />} /> 
          <Route path="treinos" element={<Treinos />} /> 
           
        </Route>
        
        {/* Rotas de Responsável dentro de ParentLayout */}
        <Route path="/responsavel" element={<ParentLayout/>}>
            <Route path="dashboard" element={<ParentDashboard />}/>
            <Route path="pagamentos" element={<Pagamentos />}/>
            <Route path="perfil" element={<Perfil />} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="frequencia" element={<Frequencia />} />
        
        </Route>
      </Routes>
 
  );
}

export default App;
