import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../../components/common';
import { driverApi, supplierApi, type FornecedorDto } from '../../../services';
import { cleanCpf, cleanPhone } from '../../../utils';
import styles from '../Fleet.module.css';

export const DriverCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [fornecedores, setFornecedores] = useState<FornecedorDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supplierApi.list().then((res) => {
      if (Array.isArray(res.response)) {
        setFornecedores(res.response);
        if (res.response.length > 0) setFornecedorId(String(res.response[0].id));
      } else if (res.response && Array.isArray(res.response.data)) {
        setFornecedores(res.response.data);
        if (res.response.data.length > 0) setFornecedorId(String(res.response.data[0].id));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawCpf = cleanCpf(cpf);

    if (!nome.trim() || !rawCpf || !email.trim() || !fornecedorId) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', description: 'Preencha nome, CPF, e-mail e fornecedor.' });
      return;
    }

    if (rawCpf.length !== 11) {
      showToast({ type: 'warning', title: 'CPF inválido', description: 'O CPF deve conter exatamente 11 caracteres alfanuméricos.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await driverApi.create({
        nome: nome.trim(),
        cpf: rawCpf,
        email: email.trim(),
        telefone: cleanPhone(telefone) || undefined,
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
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="CPF (11 caracteres) *"
              mask="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Telefone"
              mask="phone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={isSubmitting}
            />

            <div className={styles.fullWidth}>
              <Input
                label="E-mail *"
                type="email"
                placeholder="motorista@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.fullWidth}>
              <Select
                label="Fornecedor homologado *"
                options={supplierOptions.length > 0 ? supplierOptions : [{ value: '1', label: 'Fornecedor Padrão' }]}
                value={fornecedorId}
                onChange={(val) => setFornecedorId(val)}
                disabled={isSubmitting}
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
