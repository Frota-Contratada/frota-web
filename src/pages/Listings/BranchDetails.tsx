import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap';
import { branchApi, type FilialDto } from '../../services';
import styles from '../Suppliers/Suppliers.module.css';

export const BranchDetails = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const { showToast } = useToast();
  const [branch, setBranch] = useState<FilialDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className={styles.page}>
      <section className={styles.detailHeader}>
        <div>
          <h2>{branch.nome}</h2>
          <p>{endereco?.cidade || '—'} - {endereco?.uf || '—'} • CNPJ: {branch.cnpj}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={() => navigate(`/filiais/${branch.id}/editar`)}>
            Editar Filial
          </Button>
          <Button variant="outline" onClick={() => navigate('/filiais')}>
            Voltar para Filiais
          </Button>
        </div>
      </section>

      <section className={styles.detailGrid} aria-label="Detalhes da filial">
        <article className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h2>Endereço e Localização</h2>
              <p>Dados de localização geográfica cadastrados para a filial.</p>
            </div>
            <StatusBadge status="aprovado" />
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>CEP</span>
              <strong>{endereco?.cep || '—'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Logradouro</span>
              <strong>{endereco?.logradouro || '—'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Número / Compl.</span>
              <strong>{endereco ? `${endereco.numero || 'S/N'}${endereco.complemento ? ` (${endereco.complemento})` : ''}` : '—'}</strong>
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
          </div>

          <div style={{ marginTop: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Localização no Mapa
            </h3>
            <LocationPickerMap
              latitude={lat}
              longitude={lng}
              label={branch.nome}
              height={300}
            />
          </div>
        </article>

        <aside className={styles.detailCard} aria-label="Resumo operacional">
          <div className={styles.detailHeader}>
            <div>
              <h2>Coordenadas Geográficas</h2>
              <p>Pontos de latitude e longitude registrados.</p>
            </div>
          </div>

          <div className={styles.summaryList}>
            <div>
              <span>Latitude</span>
              <strong>{endereco?.latitude ? Number(endereco.latitude).toFixed(6) : lat.toFixed(6)}</strong>
            </div>
            <div>
              <span>Longitude</span>
              <strong>{endereco?.longitude ? Number(endereco.longitude).toFixed(6) : lng.toFixed(6)}</strong>
            </div>
            <div>
              <span>Status da Unidade</span>
              <strong>Ativa no sistema</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
