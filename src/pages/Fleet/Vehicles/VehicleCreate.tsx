import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../../components/common';
import { vehicleApi, supplierApi, extractListData, type FornecedorDto } from '../../../services';
import styles from '../Fleet.module.css';

export const VehicleCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipoVeiculoId, setTipoVeiculoId] = useState('1');
  const [capacidade, setCapacidade] = useState('4');
  const [fornecedorId, setFornecedorId] = useState<string>('');
  const [fornecedores, setFornecedores] = useState<FornecedorDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supplierApi.list().then((res) => {
      const list = extractListData<FornecedorDto>(res);
      setFornecedores(list);
      if (list.length > 0) {
        setFornecedorId(String(list[0].id));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!placa.trim() || !modelo.trim() || !fornecedorId) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', description: 'Preencha placa, modelo e fornecedor.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await vehicleApi.create({
        placa: placa.toUpperCase().trim(),
        modelo: modelo.trim(),
        tipoVeiculoId: Number(tipoVeiculoId),
        capacidadePassageiros: Number(capacidade) || 4,
        fornecedorId: Number(fornecedorId),
      });

      showToast({
        type: 'success',
        title: 'Veículo cadastrado',
        description: `O veículo ${modelo} (${placa.toUpperCase()}) foi adicionado à frota com sucesso.`,
      });
      navigate('/terceiros/veiculos');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar veículo';
      showToast({ type: 'error', title: 'Erro no cadastro', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supplierOptions = fornecedores.map((f) => ({
    value: String(f.id),
    label: f.nome || `Fornecedor #${f.id}`,
  }));

  const vehicleTypeOptions = [
    { value: '1', label: 'Sedan Executivo (até 4 passageiros)' },
    { value: '2', label: 'Minivan / SUV (até 6 passageiros)' },
    { value: '3', label: 'Van Executiva (até 15 passageiros)' },
    { value: '4', label: 'Micro-ônibus (até 28 passageiros)' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2>Cadastrar Novo Veículo</h2>
          <p>Adicione um veículo à frota terceirizada informando placa, capacidade e modelo.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.formGrid}>
            <Input
              label="Placa do veículo *"
              placeholder="Ex: BRA2E19"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              required
            />

            <Input
              label="Capacidade de passageiros *"
              type="number"
              min={1}
              max={60}
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
              required
            />

            <div className={styles.fullWidth}>
              <Input
                label="Modelo e especificação *"
                placeholder="Ex: Toyota Corolla 2.0 Dynamic (Preto)"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                required
              />
            </div>

            <div className={styles.fullWidth}>
              <Select
                label="Categoria de transporte *"
                options={vehicleTypeOptions}
                value={tipoVeiculoId}
                onChange={(val) => setTipoVeiculoId(val)}
              />
            </div>

            <div className={styles.fullWidth}>
              <Select
                label="Fornecedor proprietário *"
                options={supplierOptions.length > 0 ? supplierOptions : [{ value: '1', label: 'Fornecedor Padrão' }]}
                value={fornecedorId}
                onChange={(val) => setFornecedorId(val)}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => navigate('/terceiros/veiculos')}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar veículo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
