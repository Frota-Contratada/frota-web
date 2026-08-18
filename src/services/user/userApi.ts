import { apiClient } from '../api/apiClient';

export interface UsuarioPerfilDto {
  tipoPerfil: string;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
}

export interface UserMe {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  dataAtivacao: string;
  dataDesativacao?: string;
  fotoPerfil?: string;
  perfis: UsuarioPerfilDto[];
}

export interface UserMeResponse {
  response: UserMe;
}

export const userApi = {
  getMe() {
    return apiClient.get<UserMeResponse>('/usuario/me');
  },

  updateFotoPerfil(file: File) {
    const formData = new FormData();
    formData.append('foto', file);

    return apiClient.patch<UserMeResponse>('/usuario/me/foto', formData);
  },
};

