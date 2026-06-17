import { AppRoutes } from './routes';
import { ToastProvider } from './components/common';
import './styles/variables.css';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
