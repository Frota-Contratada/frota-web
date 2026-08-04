import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, StatusBadge } from '../../components/common';
import { formatDocument, suppliers } from './suppliersData';
import styles from './Suppliers.module.css';

export const SupplierDetails = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const supplier = suppliers.find((item) => item.id === Number(supplierId));

  if (!supplier) {
    return <Navigate to="/terceiros/fornecedores" replace />;
  }

  const supplierStatus = supplier.deactivatedAt ? 'Fornecedor inativo' : 'Fornecedor ativo';

  return (
    <div className={styles.page}>
      <section className={styles.detailHeader}>
        <div>
          <h2>{supplier.name}</h2>
          <p>{formatDocument(supplier.document)}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/terceiros/fornecedores')}>
          Voltar para fornecedores
        </Button>
      </section>

      <section className={styles.detailGrid} aria-label="Detalhes do fornecedor">
        <article className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h2>Dados cadastrais</h2>
              <p>Informações derivadas do cadastro base de fornecedor.</p>
            </div>
            <StatusBadge status={supplier.status} />
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Razão social / Nome</span>
              <strong>{supplier.name}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>CNPJ/CPF</span>
              <strong>{formatDocument(supplier.document)}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Data de ativação</span>
              <strong>{supplier.activatedAt}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Data de desativação</span>
              <strong>{supplier.deactivatedAt ?? 'Não informado'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Arquivo cadastral</span>
              <strong>{supplier.filePath ?? 'Não enviado'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Situação operacional</span>
              <strong>{supplierStatus}</strong>
            </div>
          </div>
        </article>

        <aside className={styles.detailCard} aria-label="Resumo de vínculos">
          <div className={styles.detailHeader}>
            <div>
              <h2>Vínculos</h2>
              <p>Relações úteis com filiais, contratos e veículos.</p>
            </div>
          </div>

          <div className={styles.summaryList}>
            <div>
              <span>Filiais vinculadas</span>
              <strong>{supplier.linkedBranches}</strong>
            </div>
            <div>
              <span>Contratos associados</span>
              <strong>{supplier.linkedContracts}</strong>
            </div>
            <div>
              <span>Veículos cadastrados</span>
              <strong>{supplier.vehicles}</strong>
            </div>
            <div>
              <span>Documento cadastral</span>
              <strong>{supplier.filePath ? 'Disponível' : 'Pendente'}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
