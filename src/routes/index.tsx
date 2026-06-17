import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login/Login';
import { TwoFactor } from '../pages/TwoFactor/TwoFactor';
import { Home } from '../pages/Home/Home';
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
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/visao-executiva" element={<Placeholder title="Visão Executiva" />} />
          <Route path="/gastos" element={<Placeholder title="Gastos" />} />
          <Route path="/preco-auditoria" element={<Placeholder title="Preço & Auditoria" />} />
          <Route path="/corridas" element={<Navigate to="/corridas/solicitacoes" replace />} />
          <Route path="/corridas/solicitacoes" element={<Placeholder title="Solicitações de Corridas" />} />
          <Route path="/corridas/calendario" element={<Placeholder title="Calendário de Corridas" />} />
          <Route path="/corridas/historico" element={<Placeholder title="Histórico de Corridas" />} />
          <Route path="/terceiros" element={<Navigate to="/terceiros/fornecedores" replace />} />
          <Route path="/terceiros/fornecedores" element={<Placeholder title="Fornecedores" />} />
          <Route path="/terceiros/contratos" element={<Placeholder title="Contratos" />} />
          <Route path="/colaboradores" element={<Placeholder title="Colaboradores" />} />
          <Route path="/filiais" element={<Placeholder title="Filiais" />} />
        </Route>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
