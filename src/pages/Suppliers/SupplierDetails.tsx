import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import { supplierApi, type FornecedorDto } from '../../services';
import { formatDocument } from './suppliersData';
import styles from './Suppliers.module.css';

export const SupplierDetails = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { showToast } = useToast();
  const [supplier, setSupplier] = useState<FornecedorDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (supplierId && !isNaN(Number(supplierId))) {
      supplierApi
        .getById(Number(supplierId))
        .then((res) => {
          if (res.response) {
            setSupplier(res.response);
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Erro ao carregar fornecedor';
          showToast({ type: 'error', title: message });
          navigate('/terceiros/fornecedores');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      navigate('/terceiros/fornecedores');
    }
  }, [supplierId, navigate, showToast]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="card"
          message="Carregando dados do fornecedor"
          submessage="Buscando histórico e vínculos..."
        />
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  return (
    <div className={styles.page}>
      <section className={styles.detailHeader}>
        <div>
          <h2>{supplier.nome}</h2>
          <p>{formatDocument(supplier.cnpjCpf)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={() => navigate(`/terceiros/fornecedores/${supplier.id}/editar`)}>
            Editar Fornecedor
          </Button>
          <Button variant="outline" onClick={() => navigate('/terceiros/fornecedores')}>
            Voltar para fornecedores
          </Button>
        </div>
      </section>

      <section className={styles.detailGrid} aria-label="Detalhes do fornecedor">
        <article className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h2>Dados cadastrais</h2>
              <p>Informações derivadas do cadastro base de fornecedor.</p>
            </div>
            <StatusBadge status="aprovado" />
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Razão social / Nome</span>
              <strong>{supplier.nome}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>CNPJ/CPF</span>
              <strong>{formatDocument(supplier.cnpjCpf)}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Situação operacional</span>
              <strong>Fornecedor ativo</strong>
            </div>
          </div>
        </article>

        <aside className={styles.detailCard} aria-label="Resumo de vínculos">
          <div className={styles.detailHeader}>
            <div>
              <h2>Vínculos Operacionais</h2>
              <p>Relações com a frota e operações corporativas.</p>
            </div>
          </div>

          <div className={styles.summaryList}>
            <div>
              <span>Status</span>
              <strong>Ativo na plataforma</strong>
            </div>
            <div>
              <span>Tipo de parceiro</span>
              <strong>Prestador homologado</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
