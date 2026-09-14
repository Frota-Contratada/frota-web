import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select } from '../../../components/common';
import { supplierApi, extractListData, type FornecedorDto } from '../../../services';
import styles from '../Fleet.module.css';

export const VehicleCreate = () => {
  const navigate = useNavigate();

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipoVeiculoId, setTipoVeiculoId] = useState('1');
  const [capacidade, setCapacidade] = useState('4');
  const [fornecedorId, setFornecedorId] = useState<string>('');
  const [fornecedores, setFornecedores] = useState<FornecedorDto[]>([]);

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
          <p>Informe as especificações do veículo e vincule ao fornecedor proprietário.</p>
        </div>

        <div style={{ padding: '0.875rem 1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', color: '#92400e', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <strong>Aviso do Sistema:</strong> O endpoint de cadastro de veículos (`POST /veiculos`) ainda não está implementado no backend. A submissão está desabilitada para evitar erros 404.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.formGrid}>
            <Input
              label="Placa do veículo *"
              placeholder="ABC-1234 ou ABC1D23"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              required
            />

            <Input
              label="Modelo do veículo *"
              placeholder="Ex: Toyota Corolla 2.0"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              required
            />

            <Select
              label="Tipo de veículo"
              options={vehicleTypeOptions}
              value={tipoVeiculoId}
              onChange={(val) => setTipoVeiculoId(val)}
            />

            <Input
              label="Capacidade de passageiros"
              type="number"
              min="1"
              max="20"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
            />

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
              Voltar
            </Button>
            <Button type="submit" disabled={true} title="Endpoint pendente no backend">
              Cadastro pendente no backend
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
