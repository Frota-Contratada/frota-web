import { useEffect, useMemo, useState } from 'react';
import { StatusBadge, type BadgeStatus } from '../../components/common';
import SetaDireitaIcon from '../../assets/icons/seta-direita.svg?react';
import { ridesApi, extractListData, type SolicitacaoDto } from '../../services';
import styles from './Calendar.module.css';

type CalendarView = 'month' | 'week';

type RideStatus = 'realizada' | 'agendada' | 'cancelada';

type Ride = {
  id: number;
  date: string;
  time: string;
  requester: string;
  origin: string;
  destination: string;
  status: RideStatus;
};

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const buildCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDays = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

const buildWeekDays = (date: Date) => {
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + index);
    return weekDate;
  });
};

const formatWeekLabel = (days: Date[]) => {
  const first = days[0];
  const last = days[days.length - 1];
  const firstLabel = first.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const lastLabel = last.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${firstLabel} - ${lastLabel}`;
};

const rideStatusToBadgeStatus = (status: RideStatus): BadgeStatus => {
  if (status === 'realizada') return 'aprovado';
  if (status === 'cancelada') return 'cancelado';
  return 'em_andamento';
};

export const Calendar = () => {
  const today = useMemo(() => new Date(), []);
  const [visibleDate, setVisibleDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(today));
  const [viewMode, setViewMode] = useState<CalendarView>('month');
  const [ridesList, setRidesList] = useState<Ride[]>([]);

  useEffect(() => {
    let isMounted = true;
    ridesApi.list()
      .then((res) => {
        if (!isMounted) return;
        const apiData = extractListData<SolicitacaoDto>(res);
        const mapped: Ride[] = apiData.map((s) => {
          const rideDate = s.dataCorrida ? new Date(s.dataCorrida) : new Date();
          const rawStatus = (s.status || 'PENDENTE').toUpperCase();
          let status: RideStatus = 'agendada';
          if (rawStatus.includes('FINALIZ') || rawStatus.includes('CONCLU')) status = 'realizada';
          else if (rawStatus.includes('CANCEL')) status = 'cancelada';

          return {
            id: s.id,
            date: toIsoDate(rideDate),
            time: rideDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            requester: s.solicitanteNome || 'Solicitante',
            origin: s.origem?.logradouro || 'Origem',
            destination: s.destino?.logradouro || 'Destino',
            status,
          };
        });
        setRidesList(mapped);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const calendarDays = useMemo(
    () => (viewMode === 'month' ? buildCalendarDays(visibleDate) : buildWeekDays(visibleDate)),
    [viewMode, visibleDate]
  );
  const calendarRows = viewMode === 'month' ? calendarDays.length / 7 : 1;
  const selectedRides = ridesList.filter((ride) => ride.date === selectedDate);
  const periodLabel = viewMode === 'month'
    ? `${MONTH_LABELS[visibleDate.getMonth()]} ${visibleDate.getFullYear()}`
    : formatWeekLabel(calendarDays);

  const changePeriod = (amount: number) => {
    setVisibleDate((current) => {
      if (viewMode === 'month') {
        return new Date(current.getFullYear(), current.getMonth() + amount, 1);
      }

      const next = new Date(current);
      next.setDate(current.getDate() + amount * 7);
      return next;
    });
  };

  const handleViewModeChange = (mode: CalendarView) => {
    setViewMode(mode);
    setVisibleDate(fromIsoDate(selectedDate));
  };

  return (
    <div className={styles.container}>
      <section className={styles.calendarCard}>
        <header className={styles.calendarHeader}>
          <div>
            <h2 className={styles.title}>Calendário de corridas</h2>
            <p className={styles.subtitle}>Acompanhe corridas realizadas e futuras em uma visão mensal.</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.viewToggle} aria-label="Tipo de visualização">
              <button
                type="button"
                className={viewMode === 'month' ? styles.viewButtonActive : styles.viewButton}
                onClick={() => handleViewModeChange('month')}
              >
                Mensal
              </button>
              <button
                type="button"
                className={viewMode === 'week' ? styles.viewButtonActive : styles.viewButton}
                onClick={() => handleViewModeChange('week')}
              >
                Semanal
              </button>
            </div>

            <div className={styles.monthControls}>
              <button type="button" className={`${styles.monthButton} ${styles.monthButtonPrev}`} onClick={() => changePeriod(-1)} aria-label="Período anterior">
                <SetaDireitaIcon width={16} height={16} />
              </button>
              <strong className={styles.monthLabel}>
                {periodLabel}
              </strong>
              <button type="button" className={styles.monthButton} onClick={() => changePeriod(1)} aria-label="Próximo período">
                <SetaDireitaIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </header>

        <div className={styles.legend}>
          <span><i className={styles.legendPast} /> Realizada</span>
          <span><i className={styles.legendFuture} /> Agendada</span>
          <span><i className={styles.legendCanceled} /> Cancelada</span>
        </div>

        <div className={styles.weekGrid}>
          {WEEK_DAYS.map((day) => (
            <span key={day} className={styles.weekDay}>{day}</span>
          ))}
        </div>

        <div
          className={`${styles.daysGrid} ${viewMode === 'week' ? styles.weekViewGrid : ''}`}
          style={{ '--calendar-rows': calendarRows } as React.CSSProperties}
        >
          {calendarDays.map((date) => {
            const isoDate = toIsoDate(date);
            const dayRides = ridesList.filter((ride) => ride.date === isoDate);
            const isOutsideMonth = viewMode === 'month' && date.getMonth() !== visibleDate.getMonth();
            const isSelected = selectedDate === isoDate;

            return (
              <button
                key={isoDate}
                type="button"
                className={`${styles.dayCell} ${viewMode === 'week' ? styles.weekDayCell : ''} ${isOutsideMonth ? styles.outsideMonth : ''} ${isSelected ? styles.selectedDay : ''}`}
                onClick={() => {
                  setSelectedDate(isoDate);
                  if (viewMode === 'week') {
                    setVisibleDate(date);
                  }
                }}
              >
                <div className={styles.dayHeaderInline}>
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  {viewMode === 'week' && (
                    <span className={styles.weekDayName}>{WEEK_DAYS[date.getDay()]}</span>
                  )}
                </div>
                <div className={styles.dayRides}>
                  {(viewMode === 'week' ? dayRides : dayRides.slice(0, 2)).map((ride) => (
                    <span key={ride.id} className={`${styles.ridePill} ${styles[ride.status]}`}>
                      {ride.time} {ride.requester}
                    </span>
                  ))}
                  {viewMode === 'month' && dayRides.length > 2 && (
                    <span className={styles.moreRides}>+{dayRides.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className={styles.detailsCard}>
        <div className={styles.detailsHeader}>
          <span className={styles.detailsDate}>{fromIsoDate(selectedDate).toLocaleDateString('pt-BR')}</span>
          <strong className={styles.detailsTitle}>Corridas do dia</strong>
        </div>

        {selectedRides.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>Nenhuma corrida</strong>
            <span>Não há corridas registradas para esta data.</span>
          </div>
        ) : (
          <div className={styles.rideList}>
            {selectedRides.map((ride) => (
              <article key={ride.id} className={styles.rideCard}>
                <div className={styles.rideHeader}>
                  <strong>{ride.time}</strong>
                  <StatusBadge status={rideStatusToBadgeStatus(ride.status)} />
                </div>
                <span className={styles.requester}>{ride.requester}</span>
                <div className={styles.routeTimeline}>
                  <div className={styles.routeStep}>
                    <span className={styles.originDot} aria-hidden="true" />
                    <div className={styles.routeDetails}>
                      <span className={styles.routeLabel}>Origem</span>
                      <strong className={styles.routeAddress} title={ride.origin}>{ride.origin}</strong>
                    </div>
                  </div>
                  <div className={styles.routeStep}>
                    <span className={styles.destinationDot} aria-hidden="true" />
                    <div className={styles.routeDetails}>
                      <span className={styles.routeLabel}>Destino</span>
                      <strong className={styles.routeAddress} title={ride.destination}>{ride.destination}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};
