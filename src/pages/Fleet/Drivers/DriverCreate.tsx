import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../../components/common';
import { driverApi, supplierApi, extractListData, type FornecedorDto } from '../../../services';
import styles from '../Fleet.module.css';

export const DriverCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnh, setCnh] = useState('');
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

    if (!nome.trim() || !cpf.trim() || !email.trim() || !fornecedorId) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', description: 'Preencha nome, CPF, e-mail e fornecedor.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await driverApi.create({
        nome: nome.trim(),
        cpf: cpf.trim(),
        email: email.trim(),
        telefone: telefone.trim() || undefined,
        cnh: cnh.trim() || undefined,
        fornecedorId: Number(fornecedorId),
      });

      showToast({
        type: 'success',
        title: 'Motorista cadastrado',
        description: `O motorista ${nome} foi cadastrado com sucesso e está ativo para viagens.`,
      });
      navigate('/terceiros/motoristas');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar motorista';
      showToast({ type: 'error', title: 'Erro no cadastro', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supplierOptions = fornecedores.map((f) => ({
    value: String(f.id),
    label: f.nome || `Fornecedor #${f.id}`,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2>Cadastrar Novo Motorista</h2>
          <p>Informe os dados cadastrais do motorista e vincule à empresa fornecedora.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <Input
                label="Nome completo *"
                placeholder="Ex: Carlos Eduardo de Oliveira"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <Input
              label="CPF *"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />

            <Input
              label="E-mail *"
              type="email"
              placeholder="motorista@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Telefone de contato"
              placeholder="(11) 98765-4321"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <Input
              label="Número da CNH"
              placeholder="00000000000"
              value={cnh}
              onChange={(e) => setCnh(e.target.value)}
            />

            <div className={styles.fullWidth}>
              <Select
                label="Fornecedor homologado *"
                options={supplierOptions.length > 0 ? supplierOptions : [{ value: '1', label: 'Fornecedor Padrão' }]}
                value={fornecedorId}
                onChange={(val) => setFornecedorId(val)}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => navigate('/terceiros/motoristas')}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar motorista
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
