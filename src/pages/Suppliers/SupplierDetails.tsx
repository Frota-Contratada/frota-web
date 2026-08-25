import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import CheckIcon from '../../assets/icons/check.svg?react';
import { supplierApi, driverApi, extractListData, type FornecedorDto, type MotoristaDto } from '../../services';
import { formatDocument } from './suppliersData';
import { formatCpf } from '../Listings/listingsData';
import styles from './Suppliers.module.css';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');

export const SupplierDetails = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supplier, setSupplier] = useState<FornecedorDto | null>(null);
  const [supplierSummary, setSupplierSummary] = useState<FornecedorDto | null>(null);
  const [driversList, setDriversList] = useState<MotoristaDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSupplierData = async () => {
    const numId = Number(supplierId);
    if (!supplierId || isNaN(numId)) {
      navigate('/terceiros/fornecedores', { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      const [byIdRes, listRes, driversRes] = await Promise.allSettled([
        supplierApi.getById(numId),
        supplierApi.list(),
        driverApi.list({ fornecedorId: numId }).catch(() => driverApi.list()),
      ]);

      if (byIdRes.status === 'fulfilled' && byIdRes.value.response) {
        setSupplier(byIdRes.value.response);
      }

      if (listRes.status === 'fulfilled') {
        const list = extractListData<FornecedorDto>(listRes.value);
        const found = list.find((s) => s.id === numId);
        if (found) {
          setSupplierSummary(found);
          if (byIdRes.status !== 'fulfilled') {
            setSupplier(found);
          }
        }
      }

      if (driversRes.status === 'fulfilled') {
        const allDrivers = extractListData<MotoristaDto>(driversRes.value);
        const filtered = allDrivers.filter((d) => d.fornecedorId === numId);
        setDriversList(filtered);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fornecedor';
      showToast({ type: 'error', title: message });
      navigate('/terceiros/fornecedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [supplierId]);

  const handleCopyCnpj = () => {
    if (!supplier?.cnpjCpf) return;
    navigator.clipboard.writeText(supplier.cnpjCpf);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'CNPJ copiado',
      description: 'Documento copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supplier?.id) return;

    try {
      setIsUploadingPhoto(true);
      await supplierApi.updateFoto(supplier.id, file);
      showToast({
        type: 'success',
        title: 'Foto atualizada com sucesso',
        description: 'A imagem do fornecedor foi atualizada.',
      });
      fetchSupplierData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar foto';
      showToast({ type: 'error', title: 'Erro no upload', description: msg });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando fornecedor"
          submessage="Buscando histórico, contratos e veículos vinculados..."
        />
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  const contratosVigentes = supplierSummary?.contratosVigentes || [];
  const isAtivo = supplierSummary?.ativo !== false;
  const dataAtivacao = supplierSummary?.dataAtivacao
    ? new Date(supplierSummary.dataAtivacao).toLocaleDateString('pt-BR')
    : 'Homologação recente';

  return (
    <div className={styles.page}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handlePhotoUpload}
      />

      <section className={styles.heroCard} aria-label="Perfil do fornecedor">
        <div className={styles.heroLeft}>
          <div
            className={styles.avatarWrapper}
            onClick={() => fileInputRef.current?.click()}
            title="Clique para alterar o logotipo"
          >
            {supplier.foto ? (
              <img src={supplier.foto} alt={supplier.nome} className={styles.avatarImg} />
            ) : (
              <span>{getInitials(supplier.nome)}</span>
            )}
            <div className={styles.avatarUploadOverlay}>
              {isUploadingPhoto ? 'Enviando...' : 'Alterar Logo'}
            </div>
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.heroTitleRow}>
              <h2>{supplier.nome}</h2>
              <StatusBadge status={isAtivo ? 'aprovado' : 'cancelado'} />
            </div>

            <div className={styles.heroMetaRow}>
              <span>
                <strong>CNPJ/CPF:</strong> {formatDocument(supplier.cnpjCpf)}
              </span>
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleCopyCnpj}
                title="Copiar número do documento"
              >
                {copied ? <CheckIcon width={12} height={12} /> : null}
                {copied ? 'Copiado!' : 'Copiar CNPJ'}
              </button>
              <span>•</span>
              <span>Parceiro desde: {dataAtivacao}</span>
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Button onClick={() => navigate('/terceiros/contratos/novo')}>
            Novo Contrato
          </Button>
          <Button variant="outline" onClick={() => navigate('/terceiros/fornecedores')}>
            Voltar para Fornecedores
          </Button>
        </div>
      </section>

      <div className={styles.sectionGrid}>
        <article className={styles.detailCard}>
          <div className={styles.cardHeaderTitle}>
            <div>
              <h3>Informações Cadastrais</h3>
              <p>Dados de identificação institucional e registro na Seara.</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Razão Social / Nome Fantasia</span>
              <strong>{supplier.nome}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Documento (CNPJ/CPF)</span>
              <strong>{formatDocument(supplier.cnpjCpf)}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Código do Fornecedor</span>
              <strong>#FORN-{String(supplier.id).padStart(4, '0')}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Tipo de Pessoa</span>
              <strong>
                {supplier.cnpjCpf.length > 11 ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)'}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span>Categoria de Parceria</span>
              <strong>Transporte e Mobilidade Corporativa</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Data de Homologação</span>
              <strong>{dataAtivacao}</strong>
            </div>
          </div>
        </article>

        <article className={styles.detailCard}>
          <div className={styles.cardHeaderTitle}>
            <div>
              <h3>Instrumentos Contratuais Vigentes</h3>
              <p>Contratos firmados com filiais para prestação de serviços de frota.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/terceiros/contratos/novo')}
            >
              + Anexar Contrato
            </Button>
          </div>

          {contratosVigentes.length > 0 ? (
            <div className={styles.contractsTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Contrato</th>
                    <th>Filial Vinculada</th>
                    <th>Início da Vigência</th>
                    <th>Término da Vigência</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {contratosVigentes.map((contrato) => (
                    <tr key={contrato.contratoId}>
                      <td>
                        <strong>CTR-{String(contrato.contratoId).padStart(4, '0')}</strong>
                      </td>
                      <td>{contrato.filialNome || `Filial #${contrato.filialId}`}</td>
                      <td>
                        {contrato.dataVigenciaInicio
                          ? new Date(contrato.dataVigenciaInicio).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td>
                        {contrato.dataVigenciaFim
                          ? new Date(contrato.dataVigenciaFim).toLocaleDateString('pt-BR')
                          : 'Indeterminado'}
                      </td>
                      <td>
                        <StatusBadge status="aprovado" />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/terceiros/contratos/${contrato.contratoId}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem' }}
                        >
                          <RedirecionarIcon width={14} height={14} />
                          Visualizar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <p>Nenhum contrato cadastrado ou vinculado diretamente a este parceiro.</p>
              <Button
                variant="outline"
                onClick={() => navigate('/terceiros/contratos/novo')}
              >
                Cadastrar Primeiro Contrato
              </Button>
            </div>
          )}
        </article>

        <article className={styles.detailCard}>
          <div className={styles.cardHeaderTitle}>
            <div>
              <h3>Motoristas Credenciados ({driversList.length})</h3>
              <p>Condutores autorizados e vinculados a este prestador de serviço.</p>
            </div>
          </div>

          {driversList.length > 0 ? (
            <div className={styles.driversGrid}>
              {driversList.map((driver) => (
                <div key={driver.id} className={styles.driverCard}>
                  <div className={styles.driverAvatar}>
                    {getInitials(driver.nome)}
                  </div>
                  <div className={styles.driverInfo}>
                    <span className={styles.driverName}>{driver.nome}</span>
                    <span className={styles.driverMeta}>{driver.email}</span>
                    {driver.cpf && (
                      <span className={styles.driverMeta}>CPF: {formatCpf(driver.cpf)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <p>Nenhum motorista vinculado a este fornecedor até o momento.</p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

