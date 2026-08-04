import { apiClient, type ApiQueryParams } from '../api/apiClient';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface RideRequestPayload {
  rideFor: string;
  beneficiaryName: string;
  origin: string;
  destination: string;
  rideAt: string;
  rideType: string;
  costCenter: string;
  passengers: number;
  passengerCpfs: string[];
  reason: string;
  supplierId?: number;
}

export interface RideReviewPayload {
  supplierId: number;
  comment?: string;
}

export interface RideRequestDto extends RideRequestPayload {
  id: number;
  requester: string;
  status: string;
  estimatedDistanceKm: number;
  estimatedValue: string;
  createdAt: string;
}

export const ridesApi = {
  listRequests(query?: ApiQueryParams) {
    return apiClient.get<PaginatedResponse<RideRequestDto>>('/ride-requests', { query });
  },

  getRequest(requestId: number) {
    return apiClient.get<RideRequestDto>(`/ride-requests/${requestId}`);
  },

  createRequest(payload: RideRequestPayload) {
    return apiClient.post<RideRequestDto>('/ride-requests', payload);
  },

  approveRequest(requestId: number, payload: RideReviewPayload) {
    return apiClient.post<RideRequestDto>(`/ride-requests/${requestId}/approve`, payload);
  },

  rejectRequest(requestId: number, comment?: string) {
    return apiClient.post<RideRequestDto>(`/ride-requests/${requestId}/reject`, { comment });
  },

  cancelRequest(requestId: number) {
    return apiClient.post<RideRequestDto>(`/ride-requests/${requestId}/cancel`);
  },

  listHistory(query?: ApiQueryParams) {
    return apiClient.get<PaginatedResponse<unknown>>('/rides/history', { query });
  },
};
