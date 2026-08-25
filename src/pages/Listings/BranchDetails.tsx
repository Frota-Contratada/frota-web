import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap';
import CheckIcon from '../../assets/icons/check.svg?react';
import { branchApi, type FilialDto } from '../../services';
import { formatCnpj } from '../../utils';
import styles from '../Suppliers/Suppliers.module.css';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');

export const BranchDetails = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const { showToast } = useToast();
  const [branch, setBranch] = useState<FilialDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (branchId && !isNaN(Number(branchId))) {
      branchApi
        .getById(Number(branchId))
        .then((res) => {
          if (res.response) {
            setBranch(res.response);
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Erro ao carregar filial';
          showToast({ type: 'error', title: message });
          navigate('/filiais');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      navigate('/filiais');
    }
  }, [branchId, navigate, showToast]);

  const handleCopyCnpj = () => {
    if (!branch?.cnpj) return;
    navigator.clipboard.writeText(branch.cnpj);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'CNPJ copiado',
      description: 'Documento copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando dados da filial"
          submessage="Consultando endereço e informações cadastradas..."
        />
      </div>
    );
  }

  if (!branch) {
    return null;
  }

  const endereco = branch.endereco;
  const lat = endereco?.latitude ?? -26.9046;
  const lng = endereco?.longitude ?? -48.6617;
  const branchCode = `#FILIAL-${String(branch.id).padStart(4, '0')}`;

  return (
    <div className={styles.page}>
      <section className={styles.heroCard} aria-label="Perfil da filial">
        <div className={styles.heroLeft}>
          <div className={styles.avatarWrapper}>
            <span>{getInitials(branch.nome)}</span>
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.heroTitleRow}>
              <h2>{branch.nome}</h2>
              <StatusBadge status="aprovado" />
            </div>

            <div className={styles.heroMetaRow}>
              {branch.cnpj && (
                <>
                  <span>
                    <strong>CNPJ:</strong> {formatCnpj(branch.cnpj)}
                  </span>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={handleCopyCnpj}
                    title="Copiar CNPJ da filial"
                  >
                    {copied ? <CheckIcon width={12} height={12} /> : null}
                    {copied ? 'Copiado!' : 'Copiar CNPJ'}
                  </button>
                  <span>•</span>
                </>
              )}
              <span>
                {endereco?.cidade || '—'} - {endereco?.uf || '—'}
              </span>
              <span>•</span>
              <span>Unidade Operacional</span>
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Button onClick={() => navigate(`/filiais/${branch.id}/editar`)}>
            Editar Filial
          </Button>
          <Button variant="outline" onClick={() => navigate('/filiais')}>
            Voltar para Filiais
          </Button>
        </div>
      </section>

      <div className={styles.sectionGrid}>
        <article className={styles.detailCard}>
          <div className={styles.cardHeaderTitle}>
            <div>
              <h3>Endereço e Dados Cadastrais</h3>
              <p>Dados de identificação institucional e localização física da filial.</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Nome da Unidade</span>
              <strong>{branch.nome}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>CNPJ da Filial</span>
              <strong>{branch.cnpj ? formatCnpj(branch.cnpj) : '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>CEP</span>
              <strong>{endereco?.cep || '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Logradouro</span>
              <strong>{endereco?.logradouro || '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Número / Complemento</span>
              <strong>
                {endereco
                  ? `${endereco.numero || 'S/N'}${endereco.complemento ? ` (${endereco.complemento})` : ''}`
                  : '—'}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span>Bairro</span>
              <strong>{endereco?.bairro || '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Cidade</span>
              <strong>{endereco?.cidade || '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Estado (UF)</span>
              <strong>{endereco?.uf || '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Identificador no Banco</span>
              <strong>{branchCode}</strong>
            </div>
          </div>
        </article>

        <article className={styles.detailCard}>
          <div className={styles.cardHeaderTitle}>
            <div>
              <h3>Geolocalização e Mapeamento</h3>
              <p>Pontos de latitude e longitude registrados para atendimento de corridas.</p>
            </div>
          </div>

          <div className={styles.infoGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '1rem' }}>
            <div className={styles.infoItem}>
              <span>Latitude Registrada</span>
              <strong>{endereco?.latitude ? Number(endereco.latitude).toFixed(6) : lat.toFixed(6)}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Longitude Registrada</span>
              <strong>{endereco?.longitude ? Number(endereco.longitude).toFixed(6) : lng.toFixed(6)}</strong>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <LocationPickerMap
              latitude={lat}
              longitude={lng}
              label={branch.nome}
              height={340}
            />
          </div>
        </article>
      </div>
    </div>
  );
};

