import { apiClient, type ApiQueryParams } from '../api/apiClient';
import type { PaginatedResponse } from '../../utils/apiHelpers';

export interface SupplierDto {
  id: number;
  name: string;
  status: string;
  vehicles: number;
  linkedContracts: number;
}

export interface ContractDto {
  id: number;
  supplierId: number;
  supplierName: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

export interface EmployeeDto {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  role: string | null;
  status: string;
}

export interface BranchDto {
  id: number;
  name: string;
  city: string;
  state: string;
  status: string;
}

export const suppliersApi = {
  list(query?: ApiQueryParams) {
    return apiClient.get<PaginatedResponse<SupplierDto>>('/suppliers', { query });
  },

  getById(supplierId: number) {
    return apiClient.get<SupplierDto>(`/suppliers/${supplierId}`);
  },
};

export const contractsApi = {
  list(query?: ApiQueryParams) {
    return apiClient.get<PaginatedResponse<ContractDto>>('/contracts', { query });
  },

  getById(contractId: number) {
    return apiClient.get<ContractDto>(`/contracts/${contractId}`);
  },

  upload(payload: FormData) {
    return apiClient.post<ContractDto>('/contracts', payload);
  },
};

export const employeesApi = {
  list(query?: ApiQueryParams) {
    return apiClient.get<PaginatedResponse<EmployeeDto>>('/employees', { query });
  },

  getById(employeeId: number) {
    return apiClient.get<EmployeeDto>(`/employees/${employeeId}`);
  },
};

export const branchesApi = {
  list(query?: ApiQueryParams) {
    return apiClient.get<PaginatedResponse<BranchDto>>('/branches', { query });
  },

  getById(branchId: number) {
    return apiClient.get<BranchDto>(`/branches/${branchId}`);
  },
};
