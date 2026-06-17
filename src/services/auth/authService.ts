import type { LoginCredentials, AuthResponse } from '../../types/auth.types';

interface TwoFactorCredentials {
  email: string;
  code: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email && credentials.password) {
          resolve({
            user: {
              id: '1',
              name: 'Usuário Teste',
              email: credentials.email,
              profile: 'admin-master',
            },
            token: 'mock-jwt-token-' + Date.now(),
          });
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      }, 1000);
    });
  }

  async verifyTwoFactor(credentials: TwoFactorCredentials): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email && credentials.code.length === 6) {
          resolve({
            user: {
              id: '1',
              name: 'Usuário Teste',
              email: credentials.email,
              profile: 'admin-master',
            },
            token: 'mock-jwt-token-' + Date.now(),
          });
        } else {
          reject(new Error('Código inválido. Confira o email e tente novamente.'));
        }
      }, 800);
    });
  }

  async resendTwoFactorCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email) {
          resolve();
        } else {
          reject(new Error('Email não informado para reenvio do código.'));
        }
      }, 500);
    });
  }

  async logout(): Promise<void> {
    return Promise.resolve();
  }

  async validateToken(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    return Boolean(token);
  }
}

export const authService = new AuthService();
