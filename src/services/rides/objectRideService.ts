export type ObjectVolume = 'compacto' | 'medio' | 'grande';

export interface ObjectDetails {
  category: string;
  categoryLabel?: string;
  volume: ObjectVolume;
  volumeLabel?: string;
  weightKg?: number;
  declaredValue?: number;
  isFragile: boolean;
  requiresSignature: boolean;
  recipientName: string;
  recipientPhone: string;
  handlingInstructions?: string;
}

const STORAGE_KEY = 'frota_ride_objects';

export const OBJECT_CATEGORY_OPTIONS = [
  { label: 'Documentos e Malotes Sigilosos', value: 'Documentos e Malotes Sigilosos' },
  { label: 'Caixa Pequena (até 30x30x30 cm)', value: 'Caixa Pequena (até 30x30x30 cm)' },
  { label: 'Caixa Média (até 50x50x50 cm)', value: 'Caixa Média (até 50x50x50 cm)' },
  { label: 'Equipamento de TI e Eletrônicos (Notebooks, Monitores)', value: 'Equipamento de TI e Eletrônicos' },
  { label: 'Peças Operacionais e Ferramentas', value: 'Peças Operacionais e Ferramentas' },
  { label: 'Amostras de Laboratório / Perecíveis', value: 'Amostras de Laboratório / Perecíveis' },
  { label: 'Materiais de Escritório / Almoxarifado', value: 'Materiais de Escritório / Almoxarifado' },
  { label: 'Outros Volumes', value: 'Outros Volumes' },
];

export const OBJECT_VOLUME_OPTIONS = [
  { label: 'Compacto (Cabe no banco do passageiro)', value: 'compacto' },
  { label: 'Médio (Porta-malas convencional)', value: 'medio' },
  { label: 'Grande (Requer utilitário ou rebatimento)', value: 'grande' },
];

export const objectRideService = {
  getAll(): Record<number, ObjectDetails> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {

    }
    return {};
  },

  get(rideOrRequestId: number | string): ObjectDetails | null {
    const id = Number(rideOrRequestId);
    const all = this.getAll();
    return all[id] || null;
  },

  getByRideId(rideOrRequestId: number | string): ObjectDetails | null {
    return this.get(rideOrRequestId);
  },

  isObjectRide(rideOrRequestId: number | string): boolean {
    const id = Number(rideOrRequestId);
    return !!this.get(id);
  },

  save(rideOrRequestId: number | string, details: ObjectDetails): void {
    const id = Number(rideOrRequestId);
    const all = this.getAll();
    all[id] = details;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {

    }
  },
};
