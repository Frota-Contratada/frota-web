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
import { SuppliersList } from '../pages/Suppliers/SuppliersList';
import { SupplierDetails } from '../pages/Suppliers/SupplierDetails';
import { RideRequestsList } from '../pages/Listings/RideRequestsList';
import { RideHistoryList } from '../pages/Listings/RideHistoryList';
import { EmployeesList } from '../pages/Listings/EmployeesList';
import { EmployeeDetails } from '../pages/Listings/EmployeeDetails';
import { BranchesList } from '../pages/Listings/BranchesList';
import { RideReview } from '../pages/Rides/RideReview';
import { RideRequestCreate } from '../pages/Rides/RideRequestCreate';
import { Placeholder } from '../pages/Placeholder';
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
          <Route path="/visao-executiva" element={<Placeholder title="Visão Executiva" />} />
          <Route path="/gastos" element={<Placeholder title="Gastos" />} />
          <Route path="/preco-auditoria" element={<Placeholder title="Preço & Auditoria" />} />
          
          <Route path="/corridas" element={<Navigate to="/corridas/solicitacoes" replace />} />
          <Route path="/corridas/solicitacoes" element={<RideRequestsList />} />
          <Route path="/corridas/solicitacoes/nova" element={<RideRequestCreate />} />
          <Route path="/corridas/solicitacoes/:requestId/revisar" element={<RideReview />} />
          <Route path="/corridas/calendario" element={<Calendar />} />
          <Route path="/corridas/historico" element={<RideHistoryList />} />
          
          <Route path="/terceiros" element={<Navigate to="/terceiros/fornecedores" replace />} />
          <Route path="/terceiros/fornecedores" element={<SuppliersList />} />
          <Route path="/terceiros/fornecedores/:supplierId" element={<SupplierDetails />} />
          <Route path="/terceiros/contratos" element={<ContractsList />} />
          <Route path="/terceiros/contratos/:contractId" element={<ContractDetails />} />

          <Route path="/colaboradores" element={<EmployeesList />} />
          <Route path="/colaboradores/:employeeId" element={<EmployeeDetails />} />
          <Route path="/filiais" element={<BranchesList />} />
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
