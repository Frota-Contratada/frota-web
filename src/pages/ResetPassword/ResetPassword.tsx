import { useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, useToast } from '../../components/common';
import { authApi } from '../../services/auth/authApi';
import cadeadoIcon from '../../assets/icons/cadeado.svg';
import styles from './ResetPassword.module.css';

const CODE_LENGTH = 6;

interface LocationState {
  email?: string;
}

const LockIcon = () => (
  <img src={cadeadoIcon} alt="" width="20" height="20" style={{ display: 'block' }} />
);

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const email = (location.state as LocationState)?.email || '';

  const [step, setStep] = useState<'pin' | 'password'>('pin');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const codeValue = code.join('');

  if (!email) {
    navigate('/forgot-password', { replace: true });
    return null;
  }

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
      await authApi.pinEnviar({ tipoToken: 'REDEFINIR_SENHA', email });
      showToast({ type: 'success', title: 'Código reenviado para seu email.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar código';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (codeValue.length !== CODE_LENGTH) {
      setValidationError('Informe o código de 6 dígitos.');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.pinConfirmar({ pin: codeValue, email });
      setStep('password');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Código inválido. Tente novamente.';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 6) {
      setValidationError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('As senhas não conferem.');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.signUp({ token: codeValue, senha: password });
      showToast({ type: 'success', title: 'Senha redefinida com sucesso.' });
      navigate('/login', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'pin') {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Card variant="elevated" padding="lg" className={styles.card}>
            <div className={styles.header}>
              <h1 className={styles.title}>Verificação de segurança</h1>
              <p className={styles.subtitle}>
                Enviamos um código de 6 dígitos para <strong>{email}</strong>.
                Insira o código abaixo.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className={styles.form}>
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

            <div className={styles.footer}>
              <button type="button" className={styles.linkButton} onClick={handleReenviarPin} disabled={isLoading}>
                Reenviar código
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card variant="elevated" padding="lg" className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Redefinir senha</h1>
            <p className={styles.subtitle}>
              Escolha uma nova senha para sua conta.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <div className={styles.inputRow}>
              <span className={styles.inputIcon}><LockIcon /></span>
              <input
                type="password"
                className={`${styles.passwordInput}${validationError ? ` ${styles.passwordInputError}` : ''}`}
                placeholder="Nova senha"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
                disabled={isLoading}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className={styles.inputRow}>
              <span className={styles.inputIcon}><LockIcon /></span>
              <input
                type="password"
                className={`${styles.passwordInput}${validationError ? ` ${styles.passwordInputError}` : ''}`}
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                disabled={isLoading}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {validationError && (
              <div className={styles.errorMessage} role="alert">{validationError}</div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              Redefinir senha
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
