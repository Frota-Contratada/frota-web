import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import { RouteMap } from '../../components/maps';
import type { RoutePoint } from '../../services/maps/routingService';
import SetaSmIcon from '../../assets/icons/seta-sm.svg?react';
import { ridesApi, type SolicitacaoDto } from '../../services';
import styles from './RideReview.module.css';

const mapStatusToBadge = (status?: string): 'em_andamento' | 'aprovado' | 'cancelado' | 'pendente' => {
  const s = status?.toUpperCase();
  if (s === 'EM_ANDAMENTO' || s === 'I') return 'em_andamento';
  if (s === 'APROVADA' || s === 'FINALIZADA' || s === 'F') return 'aprovado';
  if (s === 'CANCELADA' || s === 'REJEITADA' || s === 'C') return 'cancelado';
  return 'pendente';
};

export const RideDetails = () => {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const { showToast } = useToast();

  const [solicitacao, setSolicitacao] = useState<SolicitacaoDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (rideId && !isNaN(Number(rideId))) {
      ridesApi
        .getById(Number(rideId))
        .then((res) => {
          if (!isMounted) return;
          if (res.response) {
            setSolicitacao(res.response);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          const message = err instanceof Error ? err.message : 'Erro ao buscar detalhes da corrida';
          showToast({ type: 'error', title: message });
          navigate('/corridas/historico');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      navigate('/corridas/historico');
    }

    return () => {
      isMounted = false;
    };
  }, [rideId, navigate, showToast]);

  const originText = useMemo(() => {
    if (!solicitacao?.origem) return '—';
    const { logradouro, numero, bairro, cidade, uf } = solicitacao.origem;
    return `${logradouro || ''}, ${numero || 'S/N'} - ${bairro || ''}, ${cidade || ''} - ${uf || ''}`;
  }, [solicitacao]);

  const destinationText = useMemo(() => {
    if (!solicitacao?.destino) return '—';
    const { logradouro, numero, bairro, cidade, uf } = solicitacao.destino;
    return `${logradouro || ''}, ${numero || 'S/N'} - ${bairro || ''}, ${cidade || ''} - ${uf || ''}`;
  }, [solicitacao]);

  const routePoints = useMemo<RoutePoint[]>(() => {
    if (!solicitacao) return [];
    const points: RoutePoint[] = [];

    if (solicitacao.origem?.latitude && solicitacao.origem?.longitude) {
      points.push({
        lat: Number(solicitacao.origem.latitude),
        lng: Number(solicitacao.origem.longitude),
        label: 'Origem',
      });
    }

    if (solicitacao.paradas && Array.isArray(solicitacao.paradas)) {
      solicitacao.paradas.forEach((p, index) => {
        if (p.latitude && p.longitude) {
          points.push({
            lat: Number(p.latitude),
            lng: Number(p.longitude),
            label: `Parada ${index + 1}`,
          });
        }
      });
    }

    if (solicitacao.destino?.latitude && solicitacao.destino?.longitude) {
      points.push({
        lat: Number(solicitacao.destino.latitude),
        lng: Number(solicitacao.destino.longitude),
        label: 'Destino Final',
      });
    }

    return points;
  }, [solicitacao]);

  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando detalhes da corrida"
          submessage="Buscando itinerário e dados da viagem..."
        />
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Corrida não encontrada</h2>
          <Button variant="outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/corridas/historico')}>
            Voltar ao histórico
          </Button>
        </div>
      </div>
    );
  }

  const corrida = solicitacao.Corrida && solicitacao.Corrida.length > 0 ? solicitacao.Corrida[0] : null;
  const valorFinal = corrida?.valorFinal ?? solicitacao.valorEstimado ?? 0;
  const kmPercorrido = corrida?.kmPercorrido ?? solicitacao.distanciaEstimadaKm ?? solicitacao.distanciaKm ?? 0;

  return (
    <div className={styles.page}>
      <section className={styles.detailHeader}>
        <div>
          <h2>Corrida #{solicitacao.id}</h2>
          <p>
            {solicitacao.dataCorrida ? new Date(solicitacao.dataCorrida).toLocaleString('pt-BR') : '—'} •{' '}
            {solicitacao.tipoCorrida?.nome || 'Transporte Executivo'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={handlePrintReceipt}>
            Imprimir Recibo
          </Button>
          <Button variant="outline" onClick={() => navigate('/corridas/historico')}>
            Voltar ao histórico
          </Button>
        </div>
      </section>

      <div className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Informações do Trajeto</h3>
              <p>Origem, destino e traçado do percurso da corrida.</p>
            </div>
            <StatusBadge status={mapStatusToBadge(solicitacao.status)} />
          </div>

          <div className={styles.routeCard}>
            <div className={styles.routePoint}>
              <span className={styles.routeLabel}>
                <i className={styles.originDot} aria-hidden="true" />
                Origem
              </span>
              <strong>{originText}</strong>
            </div>

            <span className={styles.routeArrowWrapper} aria-hidden="true">
              <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
            </span>

            <div className={styles.routePoint}>
              <span className={styles.routeLabel}>
                <i className={styles.destinationDot} aria-hidden="true" />
                Destino
              </span>
              <strong>{destinationText}</strong>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <RouteMap points={routePoints} height={300} />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2rem' }}>
            <div>
              <h3>Execução da Corrida</h3>
              <p>Horários e medição de distância do trajeto.</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Data da Corrida</span>
              <strong>
                {solicitacao.dataCorrida ? new Date(solicitacao.dataCorrida).toLocaleDateString('pt-BR') : '—'}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span>Horário Agendado</span>
              <strong>
                {solicitacao.dataCorrida
                  ? new Date(solicitacao.dataCorrida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span>Distância Percorrida</span>
              <strong>{kmPercorrido > 0 ? `${Number(kmPercorrido).toLocaleString('pt-BR')} km` : 'A calcular'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Categoria do Veículo</span>
              <strong>{solicitacao.tipoVeiculo?.nome || solicitacao.tipoCorrida?.nome || 'Executiva'}</strong>
            </div>
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2rem' }}>
            <div>
              <h3>Motorista e Veículo</h3>
              <p>Identificação do condutor e placa associada.</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Motorista</span>
              <strong>{corrida?.motoristaNome || 'A definir pelo fornecedor'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Placa do Veículo</span>
              <strong>{corrida?.placaVeiculo || '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Fornecedor Credenciado</span>
              <strong>{solicitacao.fornecedorNome || (solicitacao.fornecedorId ? `Fornecedor #${solicitacao.fornecedorId}` : 'Transportes Aurora')}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Motivo / Finalidade</span>
              <strong>{solicitacao.motivo?.nome || 'Viagem Corporativa'}</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Demonstrativo de Valores</span>

            <div className={styles.summaryList}>
              <div>
                <span>Valor estimado</span>
                <strong>
                  R$ {Number(solicitacao.valorEstimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div>
                <span>Despesas extras / Pedágio</span>
                <strong>R$ 0,00</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Total Faturado</span>
                <strong style={{ color: 'var(--brand-primary)', fontSize: '1.125rem' }}>
                  R$ {Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Dados da Solicitação</span>

            <div className={styles.summaryList}>
              <div>
                <span>Solicitante</span>
                <strong>{solicitacao.solicitanteNome || 'Colaborador Solicitante'}</strong>
              </div>

              <div>
                <span>Centros de Custo</span>
                <strong>
                  {solicitacao.CentrosCusto && solicitacao.CentrosCusto.length > 0
                    ? solicitacao.CentrosCusto.map((cc) => cc.centroCustoNome || `CC #${cc.centroCustoId}`).join(', ')
                    : 'Centro de custo padrão'}
                </strong>
              </div>

              <div>
                <span>Passageiros</span>
                <strong>
                  {solicitacao.Passageiros && solicitacao.Passageiros.length > 0
                    ? `${solicitacao.Passageiros.length} pessoa(s)`
                    : '1 pessoa'}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
