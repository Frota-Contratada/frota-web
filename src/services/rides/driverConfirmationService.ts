export interface DriverConfirmationRecord {
  rideId: number;
  confirmed: boolean;
  confirmedAt: string;
  driverName: string;
  vehiclePlate?: string;
  notes?: string;
}

const STORAGE_KEY = 'frota_driver_confirmations';

export const driverConfirmationService = {
  getAll(): Record<number, DriverConfirmationRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {

    }
    return {};
  },

  get(rideId: number): DriverConfirmationRecord | null {
    const all = this.getAll();
    return all[rideId] || null;
  },

  isConfirmed(rideId: number): boolean {
    const record = this.get(rideId);
    return !!record?.confirmed;
  },

  confirm(params: {
    rideId: number;
    driverName?: string;
    vehiclePlate?: string;
    notes?: string;
  }): DriverConfirmationRecord {
    const all = this.getAll();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const record: DriverConfirmationRecord = {
      rideId: params.rideId,
      confirmed: true,
      confirmedAt: formattedDate,
      driverName: params.driverName || 'Motorista Credenciado',
      vehiclePlate: params.vehiclePlate || '—',
      notes: params.notes || 'Corrida confirmada e aceita pelo condutor.',
    };

    all[params.rideId] = record;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {

    }

    return record;
  },
};
