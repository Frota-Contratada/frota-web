import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, useToast } from '../../components/common';
import { authApi } from '../../services/auth/authApi';
import emailIcon from '../../assets/icons/email.svg';
import styles from './ForgotPassword.module.css';

const EmailIcon = () => (
  <img src={emailIcon} alt="" width="20" height="20" style={{ display: 'block' }} />
);

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError('Email é obrigatório');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.pinEnviar({ tipoToken: 'REDEFINIR_SENHA', email });
      showToast({ type: 'success', title: 'Código enviado para seu email.' });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar código';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card variant="elevated" padding="lg" className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Esqueceu a senha?</h1>
            <p className={styles.subtitle}>
              Informe seu email e enviaremos um código para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="email" label="Email" placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(undefined); }}
              error={error} leftIcon={<EmailIcon />}
              required autoComplete="email" disabled={isLoading}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              Enviar código
            </Button>
          </form>

          <div className={styles.footer}>
            <button type="button" className={styles.linkButton} onClick={() => navigate('/login')} disabled={isLoading}>
              Voltar para login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
