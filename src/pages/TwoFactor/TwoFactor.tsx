import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, useToast } from '../../components/common';
import { authApi } from '../../services/auth/authApi';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import emailIcon from '../../assets/icons/email.svg';
import type { User } from '../../types/auth.types';
import type { UserProfile } from '../../types/profile.types';
import styles from './TwoFactor.module.css';

const CODE_LENGTH = 6;

function decodeJwtPayload<T>(token: string): T {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
}

export const TwoFactor = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const storeLogin = useAuthStore((state) => state.login);
  const { logout } = useAuth();

  const [email] = useState(() => localStorage.getItem('auth_email') || '');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const pinSentRef = useRef(false);

  const codeValue = code.join('');

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
      return;
    }
    if (pinSentRef.current) return;
    pinSentRef.current = true;
    authApi.pinEnviar({ tipoToken: 'SIGN_UP', email }).catch(() => {});
  }, [email, navigate]);

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  };

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value) return;
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setValidationError(null);
    if (digit && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    updateDigit(index, event.target.value);
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((digit, index) => {
      next[index] = digit;
    });
    setCode(next);
    setValidationError(null);
    focusInput(Math.min(pasted.length, CODE_LENGTH) - 1);
  };

  const handleReenviarPin = async () => {
    try {
      setIsLoading(true);
      await authApi.pinEnviar({ tipoToken: 'SIGN_UP', email });
      showToast({ type: 'success', title: 'Código reenviado para seu email.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar código';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setValidationError('Email não encontrado. Faça login novamente.');
      return;
    }
    if (codeValue.length !== CODE_LENGTH) {
      setValidationError('Informe o código de 6 dígitos.');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.pinConfirmar({ pin: codeValue, email });

      const accessToken = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('refresh_token') || '';

      try {
        const meResponse = await authApi.me();
        const user: User = {
          id: String(meResponse.response.id),
          name: meResponse.response.nome,
          email: meResponse.response.email,
          profile: 'admin-master' as UserProfile,
        };
        storeLogin(user, accessToken, refreshToken);
      } catch {
        const payload = decodeJwtPayload<{ sub: number; email: string }>(accessToken);
        const user: User = {
          id: String(payload.sub),
          name: payload.email.split('@')[0],
          email: payload.email,
          profile: 'admin-master' as UserProfile,
        };
        storeLogin(user, accessToken, refreshToken);
      }

      localStorage.removeItem('auth_email');
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Código inválido. Tente novamente.';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    await logout();
    localStorage.removeItem('auth_email');
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card variant="elevated" padding="lg" className={styles.card}>
          <div className={styles.header}>
            <div className={styles.iconWrapper} aria-hidden="true">
              <img src={emailIcon} alt="" width="28" height="28" />
            </div>
            <h1 className={styles.title}>Verificação em duas etapas</h1>
            <p className={styles.subtitle}>
              Enviamos um código de 6 dígitos para <strong>{email}</strong>.
              Insira o código abaixo para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <fieldset className={styles.codeGroup} disabled={isLoading} aria-label="Código de verificação">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputsRef.current[index] = element; }}
                  className={`${styles.codeInput}${validationError ? ` ${styles.codeInputError}` : ''}`}
                  value={digit}
                  onChange={handleChange(index)}
                  onKeyDown={handleKeyDown(index)}
                  onPaste={handlePaste}
                  inputMode="numeric" pattern="[0-9]*" maxLength={1}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Dígito ${index + 1}`}
                />
              ))}
            </fieldset>

            {validationError && (
              <div className={styles.errorMessage} role="alert">{validationError}</div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              Verificar código
            </Button>
          </form>

          <div className={styles.footerActions}>
            <button type="button" className={styles.linkButton} onClick={handleReenviarPin} disabled={isLoading}>
              Reenviar código
            </button>
            <button type="button" className={styles.linkButton} onClick={handleCancel} disabled={isLoading}>
              Cancelar
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
