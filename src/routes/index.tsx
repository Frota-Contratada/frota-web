import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, TwoFactor, ForgotPassword, ResetPassword, SignUp } from '../pages/Auth';
import { Calendar } from '../pages/Calendar';
import { ContractsList, ContractDetails, ContractCreate } from '../pages/Contracts';
import { SuppliersList, SupplierDetails, SupplierCreate, SupplierEdit } from '../pages/Suppliers';
import { DriversList, DriverCreate } from '../pages/Fleet';
import { RideReview, RideRequestCreate, RideDetails, RideTracking, RideRequestsList, RideHistoryList } from '../pages/Rides';
import { EmployeesList, EmployeeDetails, EmployeeCreate, EmployeeEdit } from '../pages/Employees';
import { BranchesList, BranchCreate, BranchDetails, BranchEdit } from '../pages/Branches';
import { ExecutiveView, ExpensesView, PriceAuditView } from '../pages/Dashboards';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';

export const AppRoutes = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { defaultRoute, isSupplier } = usePermissions();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <Login />} />
        <Route path="/two-factor" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <TwoFactor />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <ResetPassword />} />
        <Route path="/sign-up" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <SignUp />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          
          <Route path="/visao-executiva" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><ExecutiveView /></ProtectedRoute>} />
          <Route path="/gastos" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'aprovador']}><ExpensesView /></ProtectedRoute>} />
          <Route path="/preco-auditoria" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><PriceAuditView /></ProtectedRoute>} />

          <Route path="/corridas" element={<Navigate to="/corridas/solicitacoes" replace />} />
          <Route path="/corridas/solicitacoes" element={<RideRequestsList />} />
          <Route path="/corridas/solicitacoes/nova" element={<ProtectedRoute allowedProfiles={['solicitante', 'solicitante-emergencia', 'admin-master']}><RideRequestCreate /></ProtectedRoute>} />
          <Route path="/corridas/solicitacoes/:requestId/revisar" element={<RideReview />} />
          <Route path="/corridas/calendario" element={<Calendar />} />
          <Route path="/corridas/historico" element={<RideHistoryList />} />
          <Route path="/corridas/historico/:rideId" element={<RideDetails />} />
          <Route path="/corridas/:rideId/acompanhamento" element={<RideTracking />} />
          <Route path="/corridas/historico/:rideId/acompanhamento" element={<RideTracking />} />

          <Route path="/terceiros" element={<Navigate to={isSupplier ? "/terceiros/motoristas" : "/terceiros/fornecedores"} replace />} />
          <Route path="/terceiros/fornecedores" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><SuppliersList /></ProtectedRoute>} />
          <Route path="/terceiros/fornecedores/novo" element={<ProtectedRoute allowedProfiles={['admin-master']}><SupplierCreate /></ProtectedRoute>} />
          <Route path="/terceiros/fornecedores/:supplierId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><SupplierDetails /></ProtectedRoute>} />
          <Route path="/terceiros/fornecedores/:supplierId/editar" element={<ProtectedRoute allowedProfiles={['admin-master']}><SupplierEdit /></ProtectedRoute>} />
          <Route path="/terceiros/contratos" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><ContractsList /></ProtectedRoute>} />
          <Route path="/terceiros/contratos/novo" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><ContractCreate /></ProtectedRoute>} />
          <Route path="/terceiros/contratos/:contractId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><ContractDetails /></ProtectedRoute>} />
          <Route path="/terceiros/motoristas" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin-fornecedor']}><DriversList /></ProtectedRoute>} />
          <Route path="/terceiros/motoristas/novo" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial', 'admin-fornecedor']}><DriverCreate /></ProtectedRoute>} />

          <Route path="/colaboradores" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><EmployeesList /></ProtectedRoute>} />
          <Route path="/colaboradores/novo" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><EmployeeCreate /></ProtectedRoute>} />
          <Route path="/colaboradores/:employeeId" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><EmployeeDetails /></ProtectedRoute>} />
          <Route path="/colaboradores/:employeeId/editar" element={<ProtectedRoute allowedProfiles={['admin-master', 'admin-filial']}><EmployeeEdit /></ProtectedRoute>} />

          <Route path="/filiais" element={<ProtectedRoute allowedProfiles={['admin-master']}><BranchesList /></ProtectedRoute>} />
          <Route path="/filiais/nova" element={<ProtectedRoute allowedProfiles={['admin-master']}><BranchCreate /></ProtectedRoute>} />
          <Route path="/filiais/:branchId" element={<ProtectedRoute allowedProfiles={['admin-master']}><BranchDetails /></ProtectedRoute>} />
          <Route path="/filiais/:branchId/editar" element={<ProtectedRoute allowedProfiles={['admin-master']}><BranchEdit /></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
