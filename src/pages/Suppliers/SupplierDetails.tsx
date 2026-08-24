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
          <p>CNPJ/CPF: {formatDocument(supplier.cnpjCpf)}</p>
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
              <h2>Informações do Cadastro</h2>
              <p>Dados de identificação e registro da empresa fornecedora.</p>
            </div>
            <StatusBadge status="aprovado" />
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Identificador (ID)</span>
              <strong>#{supplier.id}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Tipo de Documento</span>
              <strong>{supplier.cnpjCpf.length > 11 ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)'}</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Situação Operacional</span>
              <strong>Ativo e homologado</strong>
            </div>
            <div className={styles.infoItem}>
              <span>Categoria de Parceria</span>
              <strong>Transporte e Mobilidade</strong>
            </div>
          </div>
        </article>

        <aside className={styles.detailCard} aria-label="Resumo de vínculos">
          <div className={styles.detailHeader}>
            <div>
              <h2>Vínculos Operacionais</h2>
              <p>Relação com frotas e contratos vigentes.</p>
            </div>
          </div>

          <div className={styles.summaryList}>
            <div>
              <span>Relação com a Seara</span>
              <strong>Fornecedor Credenciado</strong>
            </div>
            <div>
              <span>Atendimento</span>
              <strong>Frota Dedicada e Sob Demanda</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
