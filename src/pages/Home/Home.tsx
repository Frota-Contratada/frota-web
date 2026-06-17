import { useAuthStore } from '../../stores/authStore';
import styles from './Home.module.css';

export const Home = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <div className={styles.container}>
      <h1>Bem-vindo, {user?.name || 'Usuário'}</h1>
      <p>Painel principal da gestão de frota</p>
    </div>
  );
};
