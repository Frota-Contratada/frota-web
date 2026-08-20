import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login/Login';
import { TwoFactor } from '../pages/TwoFactor/TwoFactor';
import { ForgotPassword } from '../pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword/ResetPassword';
import { SignUp } from '../pages/SignUp/SignUp';
import { Calendar } from '../pages/Calendar/Calendar';
import { ContractsList } from '../pages/Contracts/ContractsList';
import { ContractDetails } from '../pages/Contracts/ContractDetails';
import { ContractCreate } from '../pages/Contracts/ContractCreate';
import { SuppliersList } from '../pages/Suppliers/SuppliersList';
import { SupplierDetails } from '../pages/Suppliers/SupplierDetails';
import { SupplierCreate } from '../pages/Suppliers/SupplierCreate';
import { SupplierEdit } from '../pages/Suppliers/SupplierEdit';
import { RideRequestsList } from '../pages/Listings/RideRequestsList';
import { RideHistoryList } from '../pages/Listings/RideHistoryList';
import { EmployeesList } from '../pages/Listings/EmployeesList';
import { EmployeeDetails } from '../pages/Listings/EmployeeDetails';
import { EmployeeCreate } from '../pages/Listings/EmployeeCreate';
import { EmployeeEdit } from '../pages/Listings/EmployeeEdit';
import { BranchesList } from '../pages/Listings/BranchesList';
import { BranchCreate } from '../pages/Listings/BranchCreate';
import { BranchDetails } from '../pages/Listings/BranchDetails';
import { BranchEdit } from '../pages/Listings/BranchEdit';
import { RideReview } from '../pages/Rides/RideReview';
import { RideRequestCreate } from '../pages/Rides/RideRequestCreate';
import { RideDetails } from '../pages/Rides/RideDetails';
import { ExecutiveView } from '../pages/Dashboards/ExecutiveView';
import { ExpensesView } from '../pages/Dashboards/ExpensesView';
import { PriceAuditView } from '../pages/Dashboards/PriceAuditView';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../stores/authStore';

export const AppRoutes = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/visao-executiva" replace /> : <Login />} />
        <Route path="/two-factor" element={isAuthenticated ? <Navigate to="/visao-executiva" replace /> : <TwoFactor />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/visao-executiva" replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/visao-executiva" replace /> : <ResetPassword />} />
        <Route path="/sign-up" element={isAuthenticated ? <Navigate to="/visao-executiva" replace /> : <SignUp />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Dashboards - apenas Administradores */}
          <Route path="/visao-executiva" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><ExecutiveView /></ProtectedRoute>} />
          <Route path="/gastos" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin', 'aprovador']}><ExpensesView /></ProtectedRoute>} />
          <Route path="/preco-auditoria" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><PriceAuditView /></ProtectedRoute>} />
          
          {/* Corridas e Solicitações - Solicitantes, Aprovadores e Admins */}
          <Route path="/corridas" element={<Navigate to="/corridas/solicitacoes" replace />} />
          <Route path="/corridas/solicitacoes" element={<RideRequestsList />} />
          <Route path="/corridas/solicitacoes/nova" element={<ProtectedRoute allowedProfiles={['solicitante', 'solicitante-emergencia', 'admin-master', 'admin-filial', 'admin']}><RideRequestCreate /></ProtectedRoute>} />
          <Route path="/corridas/solicitacoes/:requestId/revisar" element={<RideReview />} />
          <Route path="/corridas/calendario" element={<Calendar />} />
          <Route path="/corridas/historico" element={<RideHistoryList />} />
          <Route path="/corridas/historico/:rideId" element={<RideDetails />} />
          
          {/* Terceiros (Fornecedores e Contratos) - Admins e Fornecedores */}
          <Route path="/terceiros" element={<Navigate to="/terceiros/fornecedores" replace />} />
          <Route path="/terceiros/fornecedores" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin-fornecedor', 'admin', 'fornecedor']}><SuppliersList /></ProtectedRoute>} />
          <Route path="/terceiros/fornecedores/novo" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin']}><SupplierCreate /></ProtectedRoute>} />
          <Route path="/terceiros/fornecedores/:supplierId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin-fornecedor', 'admin', 'fornecedor']}><SupplierDetails /></ProtectedRoute>} />
          <Route path="/terceiros/fornecedores/:supplierId/editar" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin']}><SupplierEdit /></ProtectedRoute>} />
          <Route path="/terceiros/contratos" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin', 'fornecedor', 'admin-fornecedor']}><ContractsList /></ProtectedRoute>} />
          <Route path="/terceiros/contratos/novo" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><ContractCreate /></ProtectedRoute>} />
          <Route path="/terceiros/contratos/:contractId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin', 'fornecedor', 'admin-fornecedor']}><ContractDetails /></ProtectedRoute>} />

          {/* Colaboradores - Admins */}
          <Route path="/colaboradores" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><EmployeesList /></ProtectedRoute>} />
          <Route path="/colaboradores/novo" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><EmployeeCreate /></ProtectedRoute>} />
          <Route path="/colaboradores/:employeeId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><EmployeeDetails /></ProtectedRoute>} />
          <Route path="/colaboradores/:employeeId/editar" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin']}><EmployeeEdit /></ProtectedRoute>} />
          
          {/* Filiais - Apenas Admin Master */}
          <Route path="/filiais" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin']}><BranchesList /></ProtectedRoute>} />
          <Route path="/filiais/nova" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin']}><BranchCreate /></ProtectedRoute>} />
          <Route path="/filiais/:branchId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin']}><BranchDetails /></ProtectedRoute>} />
          <Route path="/filiais/:branchId/editar" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin']}><BranchEdit /></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? "/visao-executiva" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/visao-executiva" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
