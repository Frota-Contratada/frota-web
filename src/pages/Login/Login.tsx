import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Card, useToast } from '../../components/common';
import emailIcon from '../../assets/icons/email.svg';
import cadeadoIcon from '../../assets/icons/cadeado.svg';
import searaJbsLogo from '../../assets/images/seara-jbs.svg';
import styles from './Login.module.css';

const EmailIcon = () => (
  <img src={emailIcon} alt="" width="20" height="20" style={{ display: 'block' }} />
);

const LockIcon = () => (
  <img src={cadeadoIcon} alt="" width="20" height="20" style={{ display: 'block' }} />
);

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    if (!email) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
    }
    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      errors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await login({ email, senha: password, plataforma: 'WEB' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      showToast({ type: 'error', title: message });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card variant="elevated" padding="lg" className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoWrapper}>
              <img src={searaJbsLogo} alt="Seara JBS" className={styles.logo} />
            </div>
            <h1 className={styles.title}>Gestão de Frota</h1>
            <p className={styles.subtitle}>Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <Input
              type="email" label="Email" placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setValidationErrors((prev) => ({ ...prev, email: undefined })); }}
              error={validationErrors.email} leftIcon={<EmailIcon />}
              required autoComplete="email" disabled={isLoading}
            />
            <Input
              type="password" label="Senha" placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setValidationErrors((prev) => ({ ...prev, password: undefined })); }}
              error={validationErrors.password} leftIcon={<LockIcon />}
              required autoComplete="current-password" disabled={isLoading}
            />
            <div className={styles.forgotPassword}>
              <button type="button" className={styles.linkButton} onClick={() => navigate('/forgot-password')} disabled={isLoading}>
                Esqueceu a senha?
              </button>
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              Entrar
            </Button>
          </form>
        </Card>
        <p className={styles.footer}>
          Não tem uma conta?{' '}
          <button type="button" className={styles.linkButton} onClick={() => navigate('/sign-up')} disabled={isLoading}>
            Solicite acesso
          </button>
        </p>
      </div>
    </div>
  );
};
