import { useState, useEffect } from 'react';
import { Button, Select, useToast } from '../../../components/common';
import { driverApi, vehicleApi, ridesApi, type MotoristaDto, type VeiculoDto } from '../../../services';
import styles from '../Fleet.module.css';

interface RideAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  requesterName?: string;
  passengersCount?: number;
  fornecedorId?: number;
  onSuccess?: (allocation: { motoristaNome: string; veiculoPlaca: string }) => void;
}

export const RideAllocationModal = ({
  isOpen,
  onClose,
  requestId,
  requesterName,
  passengersCount = 1,
  fornecedorId,
  onSuccess,
}: RideAllocationModalProps) => {
  const { showToast } = useToast();

  const [drivers, setDrivers] = useState<MotoristaDto[]>([]);
  const [vehicles, setVehicles] = useState<VeiculoDto[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    Promise.allSettled([
      driverApi.list(fornecedorId ? { fornecedorId } : undefined),
      vehicleApi.list(fornecedorId ? { fornecedorId, ativo: true } : { ativo: true }),
    ]).then(([driversRes, vehiclesRes]) => {
      if (driversRes.status === 'fulfilled') {
        const dList = Array.isArray(driversRes.value.response)
          ? driversRes.value.response
          : driversRes.value.response?.data || [];
        const activeDrivers = dList.filter((d) => d.ativo !== false);
        setDrivers(activeDrivers);
        if (activeDrivers.length > 0) {
          setSelectedDriverId(String(activeDrivers[0].id));
        }
      }

      if (vehiclesRes.status === 'fulfilled') {
        const vList = Array.isArray(vehiclesRes.value.response)
          ? vehiclesRes.value.response
          : vehiclesRes.value.response?.data || [];
        const activeVehicles = vList.filter((v) => v.ativo !== false);
        setVehicles(activeVehicles);
        if (activeVehicles.length > 0) {
          setSelectedVehicleId(String(activeVehicles[0].id));
        }
      }

      setIsLoading(false);
    });
  }, [isOpen, fornecedorId]);

  if (!isOpen) return null;

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();

    const chosenDriver = drivers.find((d) => String(d.id) === selectedDriverId);
    const chosenVehicle = vehicles.find((v) => String(v.id) === selectedVehicleId);

    if (!chosenDriver || !chosenVehicle) {
      showToast({ type: 'warning', title: 'Seleção necessária', description: 'Selecione um motorista e um veículo para alocar.' });
      return;
    }

    if ((chosenVehicle.capacidadePassageiros || 4) < passengersCount) {
      showToast({
        type: 'warning',
        title: 'Capacidade insuficiente',
        description: `O veículo comporta ${chosenVehicle.capacidadePassageiros} passageiros, mas a corrida requer ${passengersCount}.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await ridesApi.alocarMotoristaEVeiculo(requestId, {
        motoristaId: chosenDriver.id,
        veiculoId: chosenVehicle.id,
      });

      showToast({
        type: 'success',
        title: 'Recursos alocados com sucesso',
        description: `Motorista ${chosenDriver.nome} e veículo ${chosenVehicle.placa} foram atribuídos à solicitação #${requestId}.`,
      });
      onSuccess?.({
        motoristaNome: chosenDriver.nome,
        veiculoPlaca: chosenVehicle.placa,
      });
      onClose();
    } catch (err: any) {
      const message = err?.message || 'Não foi possível alocar o motorista e veículo à corrida no servidor.';
      showToast({ type: 'error', title: 'Falha na alocação', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const driverOptions = drivers.map((d) => ({
    value: String(d.id),
    label: `${d.nome} (CPF: ${d.cpf})`,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: String(v.id),
    label: `${v.modelo} [${v.placa}] — ${v.capacidadePassageiros || 4} lugares`,
  }));

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modalCard} style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3>Atribuir Motorista e Veículo à Corrida</h3>
          <p>
            Alocação de recursos operacionais para a solicitação #{requestId}
            {requesterName ? ` (${requesterName})` : ''} • {passengersCount} passageiro(s).
          </p>
        </div>

        <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Carregando motoristas e veículos disponíveis...</p>
          ) : (
            <>
              <div>
                <Select
                  label="Motorista homologado *"
                  options={driverOptions.length > 0 ? driverOptions : [{ value: '', label: 'Nenhum motorista ativo' }]}
                  value={selectedDriverId}
                  onChange={(val) => setSelectedDriverId(val)}
                  disabled={driverOptions.length === 0}
                />
              </div>

              <div>
                <Select
                  label="Veículo da frota *"
                  options={vehicleOptions.length > 0 ? vehicleOptions : [{ value: '', label: 'Nenhum veículo ativo' }]}
                  value={selectedVehicleId}
                  onChange={(val) => setSelectedVehicleId(val)}
                  disabled={vehicleOptions.length === 0}
                />
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isLoading || driverOptions.length === 0 || vehicleOptions.length === 0}
            >
              Confirmar atribuição
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
