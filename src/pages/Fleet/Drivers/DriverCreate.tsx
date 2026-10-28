import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, SearchableSelect, useToast } from '../../../components/common';
import { driverApi, type FornecedorDto } from '../../../services';
import { usePermissions } from '../../../hooks/usePermissions';
import { supplierToOption, useSupplierSearch } from '../../../hooks/useSelectionLists';
import { cleanCpf, cleanPhone } from '../../../utils';
import { resolveFornecedorIdDoToken } from '../../../utils/apiHelpers';
import styles from '../Fleet.module.css';

export const DriverCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isSupplier, isAdmin } = usePermissions();
  // O admin de fornecedor cadastra sempre no próprio fornecedor: não escolhe.
  const escolheFornecedor = isAdmin || !isSupplier;

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fornecedor, setFornecedor] = useState<FornecedorDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    suppliers: fornecedores,
    search: buscarFornecedores,
    isRemote: buscaFornecedorNoServidor,
    isLoading: buscandoFornecedores,
  } = useSupplierSearch(escolheFornecedor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawCpf = cleanCpf(cpf);
    const fornecedorId = escolheFornecedor ? fornecedor?.id : resolveFornecedorIdDoToken();

    if (!nome.trim() || !rawCpf || !email.trim() || !fornecedorId) {
      showToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        description: escolheFornecedor ? 'Preencha nome, CPF, e-mail e fornecedor.' : 'Preencha nome, CPF e e-mail.',
      });
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
        fornecedorId,
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

            {escolheFornecedor && (
              <div className={styles.fullWidth}>
                <SearchableSelect
                  label="Fornecedor homologado *"
                  placeholder="Selecione o fornecedor"
                  searchPlaceholder={buscaFornecedorNoServidor ? 'Digite o nome ou o CNPJ/CPF' : 'Digite para buscar'}
                  options={fornecedores.map(supplierToOption)}
                  value={fornecedor ? String(fornecedor.id) : ''}
                  onSearch={buscarFornecedores}
                  isLoading={buscandoFornecedores}
                  selectedLabel={fornecedor ? supplierToOption(fornecedor).label : undefined}
                  onChange={(val) => setFornecedor(fornecedores.find((f) => String(f.id) === val) ?? null)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}
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
