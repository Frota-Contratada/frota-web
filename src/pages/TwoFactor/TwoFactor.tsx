import { useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import { authService } from '../../services/auth/authService';
import { useAuthStore } from '../../stores/authStore';
import EmailIcon from '../../assets/icons/email.svg?react';
import styles from './TwoFactor.module.css';

const CODE_LENGTH = 6;

interface LocationState {
  email?: string;
}

export const TwoFactor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as LocationState | null)?.email ?? '';
  const login = useAuthStore((state) => state.login);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const codeValue = code.join('');

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
    setError(null);
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
    setError(null);
    focusInput(Math.min(pasted.length, CODE_LENGTH) - 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (codeValue.length !== CODE_LENGTH) {
      setError('Informe o código de 6 dígitos enviado por email.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await authService.verifyTwoFactor({ email, code: codeValue });
      login(response.user, response.token);
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Código inválido. Tente novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    await authService.resendTwoFactorCode(email);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card variant="elevated" padding="lg" className={styles.card}>
          <div className={styles.header}>
            <div className={styles.iconWrapper} aria-hidden="true">
              <EmailIcon width={28} height={28} />
            </div>
            <h1 className={styles.title}>Verificação em duas etapas</h1>
            <p className={styles.subtitle}>
              Enviamos um código de 6 dígitos para <strong>{email || 'seu email'}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <fieldset className={styles.codeGroup} disabled={isLoading} aria-label="Código de verificação">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputsRef.current[index] = element; }}
                  className={`${styles.codeInput} ${error ? styles.codeInputError : ''}`}
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

            {error && (
              <div className={styles.errorAlert} role="alert">{error}</div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              Confirmar código
            </Button>
          </form>

          <div className={styles.footerActions}>
            <button type="button" className={styles.linkButton} onClick={() => navigate('/login')} disabled={isLoading}>
              Voltar para login
            </button>
            <button type="button" className={styles.linkButton} onClick={handleResend} disabled={isLoading || !email}>
              Reenviar código
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
