import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login/Login';
import { TwoFactor } from '../pages/TwoFactor/TwoFactor';
import { ForgotPassword } from '../pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword/ResetPassword';
import { SignUp } from '../pages/SignUp/SignUp';
import { Home } from '../pages/Home/Home';
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
        <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/two-factor" element={isAuthenticated ? <Navigate to="/home" replace /> : <TwoFactor />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/home" replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/home" replace /> : <ResetPassword />} />
        <Route path="/sign-up" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUp />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/visao-executiva" element={<ExecutiveView />} />
          <Route path="/gastos" element={<ExpensesView />} />
          <Route path="/preco-auditoria" element={<PriceAuditView />} />
          
          <Route path="/corridas" element={<Navigate to="/corridas/solicitacoes" replace />} />
          <Route path="/corridas/solicitacoes" element={<RideRequestsList />} />
          <Route path="/corridas/solicitacoes/nova" element={<RideRequestCreate />} />
          <Route path="/corridas/solicitacoes/:requestId/revisar" element={<RideReview />} />
          <Route path="/corridas/calendario" element={<Calendar />} />
          <Route path="/corridas/historico" element={<RideHistoryList />} />
          <Route path="/corridas/historico/:rideId" element={<RideDetails />} />
          
          <Route path="/terceiros" element={<Navigate to="/terceiros/fornecedores" replace />} />
          <Route path="/terceiros/fornecedores" element={<SuppliersList />} />
          <Route path="/terceiros/fornecedores/novo" element={<SupplierCreate />} />
          <Route path="/terceiros/fornecedores/:supplierId" element={<SupplierDetails />} />
          <Route path="/terceiros/fornecedores/:supplierId/editar" element={<SupplierEdit />} />
          <Route path="/terceiros/contratos" element={<ContractsList />} />
          <Route path="/terceiros/contratos/novo" element={<ContractCreate />} />
          <Route path="/terceiros/contratos/:contractId" element={<ContractDetails />} />

          <Route path="/colaboradores" element={<EmployeesList />} />
          <Route path="/colaboradores/novo" element={<EmployeeCreate />} />
          <Route path="/colaboradores/:employeeId" element={<EmployeeDetails />} />
          <Route path="/colaboradores/:employeeId/editar" element={<EmployeeEdit />} />
          <Route path="/filiais" element={<BranchesList />} />
          <Route path="/filiais/nova" element={<BranchCreate />} />
          <Route path="/filiais/:branchId" element={<BranchDetails />} />
          <Route path="/filiais/:branchId/editar" element={<BranchEdit />} />
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
