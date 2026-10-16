import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, StatCard, StatusBadge, useToast } from '../../../components/common';
import { RouteMap } from '../../../components/maps';
import type { RoutePoint } from '../../../services/maps/routingService';
import SetaSmIcon from '../../../assets/icons/seta-sm.svg?react';
import CheckIcon from '../../../assets/icons/check.svg?react';
import { ridesApi, mapCorridaToSolicitacao, type SolicitacaoDto } from '../../../services';
import styles from './RideDetails.module.css';

const mapStatusToBadge = (status?: string): 'em_andamento' | 'aprovado' | 'cancelado' | 'pendente' => {
  const s = status?.toUpperCase();
  if (s === 'EM_ANDAMENTO' || s === 'I') return 'em_andamento';
  if (s === 'APROVADA' || s === 'FINALIZADA' || s === 'F') return 'aprovado';
  if (s === 'CANCELADA' || s === 'REJEITADA' || s === 'C') return 'cancelado';
  return 'pendente';
};

const getInitials = (name?: string) => {
  if (!name) return 'MO';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
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
      const id = Number(rideId);
      
      ridesApi
        .getCorridaById(id)
        .then(async (corridaRes) => {
          if (!isMounted) return;
          if (corridaRes?.response) {
            const corridaData = corridaRes.response;
            if (corridaData.solicitacaoId) {
              try {
                const solRes = await ridesApi.getById(corridaData.solicitacaoId);
                if (!isMounted) return;
                if (solRes.response) {
                  setSolicitacao({
                    ...solRes.response,
                    corrida: corridaData,
                    Corrida: [corridaData as any],
                  });
                  return;
                }
              } catch {
              }
            }
            setSolicitacao(mapCorridaToSolicitacao(corridaData));
            return;
          }
        })
        .catch(async () => {
          try {
            const solRes = await ridesApi.getById(id);
            if (!isMounted) return;
            if (solRes.response) {
              setSolicitacao(solRes.response);
              return;
            }
          } catch {
          }

          if (!isMounted) return;
          showToast({ type: 'error', title: 'Erro ao buscar detalhes da corrida' });
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
    if (solicitacao?.localPartida) return solicitacao.localPartida;
    if (solicitacao?.origem?.descricao) return solicitacao.origem.descricao;
    if (!solicitacao?.origem) return '—';
    const { logradouro, numero, bairro, cidade, uf } = solicitacao.origem;
    return `${logradouro || ''}${numero ? `, ${numero}` : ''}${bairro ? ` - ${bairro}` : ''}${cidade ? `, ${cidade}` : ''}${uf ? ` - ${uf}` : ''}`.trim() || '—';
  }, [solicitacao]);

  const destinationText = useMemo(() => {
    if (solicitacao?.localDestino) return solicitacao.localDestino;
    if (solicitacao?.destino?.descricao) return solicitacao.destino.descricao;
    if (!solicitacao?.destino) return '—';
    const { logradouro, numero, bairro, cidade, uf } = solicitacao.destino;
    return `${logradouro || ''}${numero ? `, ${numero}` : ''}${bairro ? ` - ${bairro}` : ''}${cidade ? `, ${cidade}` : ''}${uf ? ` - ${uf}` : ''}`.trim() || '—';
  }, [solicitacao]);

  const intermediateStops = useMemo(() => {
    if (!solicitacao?.paradas || !Array.isArray(solicitacao.paradas)) return [];
    return solicitacao.paradas.map((p: any, idx: number) => {
      const end = p.endereco || p;
      const text = end.logradouro
        ? `${end.logradouro}, ${end.numero || 'S/N'} - ${end.bairro || ''}, ${end.cidade || ''}`
        : `Parada #${idx + 1}`;
      return { index: idx + 1, text };
    });
  }, [solicitacao]);

  const routePoints = useMemo<RoutePoint[]>(() => {
    if (!solicitacao) return [];
    const points: RoutePoint[] = [];

    const origObj = (solicitacao as any).origem || (solicitacao as any).enderecoOrigem;
    const origLat = origObj?.latitude ?? origObj?.lat ?? (solicitacao as any).origemLatitude ?? (solicitacao as any).latitudeOrigem;
    const origLng = origObj?.longitude ?? origObj?.lng ?? (solicitacao as any).origemLongitude ?? (solicitacao as any).longitudeOrigem;

    if (origLat != null && origLng != null && !isNaN(Number(origLat)) && !isNaN(Number(origLng))) {
      points.push({
        lat: Number(origLat),
        lng: Number(origLng),
        label: 'Origem',
      });
    }

    if (solicitacao.paradas && Array.isArray(solicitacao.paradas)) {
      solicitacao.paradas.forEach((p, index) => {
        const paradaObj = p as any;
        const lat = paradaObj.endereco?.latitude ?? paradaObj.latitude;
        const lng = paradaObj.endereco?.longitude ?? paradaObj.longitude;
        if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
          points.push({
            lat: Number(lat),
            lng: Number(lng),
            label: `Parada ${index + 1}`,
          });
        }
      });
    }

    const destObj = (solicitacao as any).destino || (solicitacao as any).enderecoDestino;
    const destLat = destObj?.latitude ?? destObj?.lat ?? (solicitacao as any).destinoLatitude ?? (solicitacao as any).latitudeDestino;
    const destLng = destObj?.longitude ?? destObj?.lng ?? (solicitacao as any).destinoLongitude ?? (solicitacao as any).longitudeDestino;

    if (destLat != null && destLng != null && !isNaN(Number(destLat)) && !isNaN(Number(destLng))) {
      points.push({
        lat: Number(destLat),
        lng: Number(destLng),
        label: 'Destino Final',
      });
    }

    return points;
  }, [solicitacao]);

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

  const corridaId = corrida?.id ?? solicitacao.corrida?.id ?? solicitacao.id;
  const isInProgress =
    corrida?.status === 'I' ||
    solicitacao.corrida?.status === 'I' ||
    solicitacao.status === 'I' ||
    solicitacao.status === 'EM_ANDAMENTO';

  const effectiveStatus = corrida?.status ?? solicitacao.status;

  const passengersList = solicitacao.Passageiros && solicitacao.Passageiros.length > 0
    ? solicitacao.Passageiros
    : [{ nome: solicitacao.solicitanteNome || 'Passageiro Principal', solicitante: true }];

  return (
    <div className={styles.page}>
      {/* Hero Header Card */}
      <section className={styles.heroCard} aria-label="Identificação da corrida">
        <div className={styles.heroLeft}>
          <div className={styles.heroInfo}>
            <div className={styles.heroTitleRow}>
              <h2>
                {corrida?.id
                  ? `Corrida #${corrida.id}`
                  : `Solicitação de Transporte #${solicitacao.id}`}
              </h2>
              <StatusBadge status={mapStatusToBadge(effectiveStatus)} />
            </div>

            <div className={styles.heroMetaRow}>
              <span className={styles.metaItem}>
                <strong>Data:</strong>{' '}
                {solicitacao.dataCorrida ? new Date(solicitacao.dataCorrida).toLocaleString('pt-BR') : '—'}
              </span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.metaItem}>
                <strong>Categoria:</strong> {solicitacao.tipoVeiculo?.nome || solicitacao.tipoCorrida?.nome || 'Transporte Executivo'}
              </span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.metaItem}>
                <strong>Solicitante:</strong> {solicitacao.solicitanteNome || 'Colaborador Solicitante'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Button onClick={() => navigate(`/corridas/${corridaId || rideId}/acompanhamento`)}>
            {isInProgress ? 'Acompanhar ao vivo' : 'Ver Acompanhamento / Simulação'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/corridas/historico')}>
            Voltar ao histórico
          </Button>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className={styles.statsGrid} aria-label="Indicadores da corrida">
        <StatCard
          title="Total Faturado"
          value={`R$ ${Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          title="Distância Total"
          value={`${kmPercorrido > 0 ? Number(kmPercorrido).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'} km`}
        />
        <StatCard
          title="Passageiros"
          value={`${passengersList.length} ${passengersList.length === 1 ? 'pessoa' : 'pessoas'}`}
        />
        <StatCard
          title="Veículo / Categoria"
          value={solicitacao.tipoVeiculo?.nome || solicitacao.tipoCorrida?.nome || 'Executiva'}
        />
      </section>

      {/* Main Content Layout */}
      <div className={styles.contentLayout}>
        {/* Left Column: Itinerário, Execução, Motorista */}
        <div className={styles.mainColumn}>
          {/* Card: Trajeto e Itinerário */}
          <article className={styles.detailCard}>
            <div className={styles.cardHeaderTitle}>
              <div>
                <h3>Informações do Trajeto</h3>
                <p>Origem, destino e traçado georreferenciado do percurso.</p>
              </div>
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
                <SetaSmIcon width={12} height={12} className={styles.routeArrow} />
              </span>

              <div className={styles.routePoint}>
                <span className={styles.routeLabel}>
                  <i className={styles.destinationDot} aria-hidden="true" />
                  Destino
                </span>
                <strong>{destinationText}</strong>
              </div>
            </div>

            {intermediateStops.length > 0 && (
              <div className={styles.stopsContainer}>
                <span className={styles.stopsTitle}>Paradas Intermediárias ({intermediateStops.length})</span>
                {intermediateStops.map((stop) => (
                  <div key={stop.index} className={styles.stopItem}>
                    <i className={styles.stopDot} aria-hidden="true" />
                    <span><strong>Parada {stop.index}:</strong> {stop.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.mapContainer}>
              <RouteMap points={routePoints} height={340} allowPlayback={false} />
            </div>
          </article>

          {/* Card: Execução da Corrida */}
          <article className={styles.detailCard}>
            <div className={styles.cardHeaderTitle}>
              <div>
                <h3>Execução da Corrida</h3>
                <p>Horários, quilometragem aferida e finalidade do deslocamento.</p>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span>Data da Viagem</span>
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
                <span>Categoria Solicitada</span>
                <strong>{solicitacao.tipoVeiculo?.nome || solicitacao.tipoCorrida?.nome || 'Executiva'}</strong>
              </div>

              <div className={styles.infoItem}>
                <span>Finalidade / Motivo</span>
                <strong>{solicitacao.motivo?.nome || 'Viagem Corporativa'}</strong>
              </div>

              <div className={styles.infoItem}>
                <span>Fornecedor Credenciado</span>
                <strong>
                  {solicitacao.fornecedorNome || (solicitacao.fornecedorId ? `Fornecedor #${solicitacao.fornecedorId}` : 'Transportes Aurora')}
                </strong>
              </div>
            </div>
          </article>

          {/* Card: Motorista e Veículo */}
          <article className={styles.detailCard}>
            <div className={styles.cardHeaderTitle}>
              <div>
                <h3>Motorista e Veículo Designado</h3>
                <p>Identificação do condutor parceiro e placa oficial do veículo.</p>
              </div>
            </div>

            <div className={styles.driverCard}>
              <div className={styles.driverProfile}>
                <div className={styles.driverAvatar}>
                  {getInitials(corrida?.motoristaNome)}
                </div>
                <div className={styles.driverDetails}>
                  <strong className={styles.driverName}>
                    {corrida?.motoristaNome || 'Motorista a definir pelo fornecedor'}
                  </strong>
                  <span className={styles.driverCompany}>
                    {solicitacao.fornecedorNome || 'Fornecedor credenciado'} • {solicitacao.tipoVeiculo?.nome || 'Veículo Executivo'}
                  </span>
                </div>
              </div>

              <div>
                <span className={styles.plateBadge}>
                  {corrida?.placaVeiculo ? corrida.placaVeiculo.toUpperCase() : 'PLACA N/D'}
                </span>
              </div>
            </div>
          </article>
        </div>

        {/* Right Column: Demonstrativo de Valores & Dados da Solicitação */}
        <aside className={styles.sideColumn} aria-label="Demonstrativo e dados administrativos">
          {/* Card: Demonstrativo Financeiro */}
          <section className={styles.receiptCard}>
            <div className={styles.receiptTitle}>
              <span>Demonstrativo de Valores</span>
            </div>

            <div className={styles.receiptList}>
              <div className={styles.receiptRow}>
                <span>Valor base estimado</span>
                <strong>
                  R$ {Number(solicitacao.valorEstimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className={styles.receiptRow}>
                <span>Taxas extras / Pedágio</span>
                <strong>R$ 0,00</strong>
              </div>

              <div className={styles.receiptTotalRow}>
                <span>Total Faturado</span>
                <strong>
                  R$ {Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className={styles.auditBadge}>
              <CheckIcon width={16} height={16} />
              <span>Tarifa validada e em conformidade</span>
            </div>

            {corrida?.valorFinal && solicitacao.valorEstimado && Number(corrida.valorFinal) !== Number(solicitacao.valorEstimado) && (
              <div className={styles.priceNoticeBanner} role="status">
                <div>
                  <strong>Aviso Tarifário:</strong> O valor final realizado foi de R$ {Number(corrida.valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, com ajuste sobre a estimativa de R$ {Number(solicitacao.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                </div>
              </div>
            )}
          </section>

          {/* Card: Dados Administrativos e Passageiros */}
          <section className={styles.metaCard}>
            <div className={styles.receiptTitle}>
              <span>Dados da Solicitação</span>
            </div>

            <div className={styles.metaList}>
              <div className={styles.metaRow}>
                <label>Solicitante</label>
                <strong>{solicitacao.solicitanteNome || 'Colaborador Solicitante'}</strong>
              </div>

              <div className={styles.metaRow}>
                <label>Centro de Custo</label>
                <strong>
                  {solicitacao.CentrosCusto && solicitacao.CentrosCusto.length > 0
                    ? solicitacao.CentrosCusto.map((cc) => cc.centroCustoNome || `CC #${cc.centroCustoId}`).join(', ')
                    : 'Centro de custo padrão'}
                </strong>
              </div>

              <div className={styles.metaRow}>
                <label>Passageiros Registrados ({passengersList.length})</label>
                <div className={styles.passengerTags}>
                  {passengersList.map((pass, idx) => (
                    <span key={idx} className={styles.passengerTag}>
                      {pass.nome || `Passageiro ${idx + 1}`}
                      {pass.solicitante ? ' (Titular)' : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.metaRow}>
                <label>Protocolo Geral</label>
                <strong>SOL-{String(solicitacao.id).padStart(5, '0')}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
