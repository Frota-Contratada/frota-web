import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, StatusBadge, useToast } from '../../components/common';
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
        <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Carregando dados da filial...</p>
      </div>
    );
  }

  if (!branch) {
    return null;
  }

  const endereco = branch.endereco;

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
              <h2>Informações Institucionais e Endereço</h2>
              <p>Localização geográfica e dados de registro da filial.</p>
            </div>
            <StatusBadge status="aprovado" />
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Nome da Filial</span>
              <strong>{branch.nome}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>CNPJ</span>
              <strong>{branch.cnpj}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>CEP</span>
              <strong>{endereco?.cep || '—'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Endereço</span>
              <strong>{endereco ? `${endereco.logradouro}, ${endereco.numero}` : '—'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Bairro</span>
              <strong>{endereco?.bairro || '—'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Cidade / UF</span>
              <strong>{endereco ? `${endereco.cidade} / ${endereco.uf}` : '—'}</strong>
            </div>
          </div>
        </article>

        <aside className={styles.detailCard} aria-label="Resumo operacional">
          <div className={styles.detailHeader}>
            <div>
              <h2>Operações & Coordenadas</h2>
              <p>Geolocalização registrada da unidade.</p>
            </div>
          </div>

          <div className={styles.summaryList}>
            <div>
              <span>Latitude</span>
              <strong>{endereco?.latitude ?? '—'}</strong>
            </div>
            <div>
              <span>Longitude</span>
              <strong>{endereco?.longitude ?? '—'}</strong>
            </div>
            <div>
              <span>Status Operacional</span>
              <strong>Operando normalmente</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
