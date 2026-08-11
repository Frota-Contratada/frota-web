import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, StatusBadge } from '../../components/common';
import { branches } from './listingsData';
import styles from '../Suppliers/Suppliers.module.css';

export const BranchDetails = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const branch = branches.find((item) => item.id === Number(branchId));

  if (!branch) {
    return <Navigate to="/filiais" replace />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.detailHeader}>
        <div>
          <h2>{branch.name}</h2>
          <p>{branch.city} - {branch.state} • CNPJ Ativo</p>
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
            <StatusBadge status={branch.status} />
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Nome da Filial</span>
              <strong>{branch.name}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>CEP</span>
              <strong>{branch.zipCode}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Endereço</span>
              <strong>{branch.address}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Bairro</span>
              <strong>{branch.neighborhood}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Cidade / UF</span>
              <strong>{branch.city} / {branch.state}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Data de Ativação</span>
              <strong>{branch.activatedAt}</strong>
            </div>
          </div>
        </article>

        <aside className={styles.detailCard} aria-label="Resumo operacional">
          <div className={styles.detailHeader}>
            <div>
              <h2>Operações & Custos</h2>
              <p>Métricas consolidadas vinculadas à unidade.</p>
            </div>
          </div>

          <div className={styles.summaryList}>
            <div>
              <span>Centros de Custo</span>
              <strong>{branch.costCenters}</strong>
            </div>
            <div>
              <span>Fornecedores Ativos</span>
              <strong>{branch.suppliers}</strong>
            </div>
            <div>
              <span>Solicitações Realizadas</span>
              <strong>{branch.requests}</strong>
            </div>
            <div>
              <span>Status Operacional</span>
              <strong>{branch.deactivatedAt ? `Desativado em ${branch.deactivatedAt}` : 'Operando normalmente'}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
