'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import styles from './Analytics.module.css';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

/* =========================================================
   TIPOS BASE DEL DASHBOARD
   ========================================================= */
interface FrequentQuestion {
  question: string;
  count: number;
}

type RangeOption = 'today' | '7days' | '30days' | 'month' | 'all';
type DetailType = 'users' | 'activeUsers' | 'sessions' | 'questions' | null;

interface DetailItem {
  primary: string;
  secondary?: string;
  meta?: string;
}

interface DailyMessagesData {
  date: string;
  messages: number;
}

interface DailySessionsData {
  date: string;
  sessions: number;
}

interface DailyActiveUsersData {
  date: string;
  users: number;
}

interface TopQuestionChartData {
  question: string;
  count: number;
}

interface TopUserData {
  user_email: string;
  sessions: number;
}

/* =========================================================
   AQUI SE MANEJA EL RANGO DE FECHAS ACTUAL
   ========================================================= */
function getDateRange(range: RangeOption) {
  const now = new Date();
  const start = new Date();

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }

  if (range === '7days') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }

  if (range === '30days') {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }

  if (range === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }

  return {
    startDate: null,
    endDate: null,
  };
}

/* =========================================================
   AQUI SE MANEJA EL PERIODO ANTERIOR
   ESTO SIRVE PARA CALCULAR CRECIMIENTO
   ========================================================= */
function getPreviousDateRange(range: RangeOption) {
  const now = new Date();
  const start = new Date();
  const previousEnd = new Date();
  const previousStart = new Date();

  if (range === 'today') {
    previousEnd.setDate(now.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    previousStart.setDate(now.getDate() - 1);
    previousStart.setHours(0, 0, 0, 0);

    return {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
    };
  }

  if (range === '7days') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    previousEnd.setTime(start.getTime() - 1);
    previousStart.setTime(start.getTime());
    previousStart.setDate(previousStart.getDate() - 7);

    return {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
    };
  }

  if (range === '30days') {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    previousEnd.setTime(start.getTime() - 1);
    previousStart.setTime(start.getTime());
    previousStart.setDate(previousStart.getDate() - 30);

    return {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
    };
  }

  if (range === 'month') {
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);
    const lastMonthStart = new Date(
      lastMonthEnd.getFullYear(),
      lastMonthEnd.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    return {
      startDate: lastMonthStart.toISOString(),
      endDate: lastMonthEnd.toISOString(),
    };
  }

  return {
    startDate: null,
    endDate: null,
  };
}

/* =========================================================
   FORMATEO DE FECHAS
   ========================================================= */
function formatDate(dateString?: string) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-GT', {
    month: 'short',
    day: 'numeric',
  });
}

function normalizeDateKey(dateString: string) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/* =========================================================
   CALCULO DE CRECIMIENTO
   ========================================================= */
function calculateGrowth(current: number, previous: number) {
  if (previous === 0 && current > 0) return 100;
  if (previous === 0 && current === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatGrowthLabel(value: number) {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return '0%';
}

/* =========================================================
   EXPORTAR DETALLE A CSV
   ========================================================= */
function exportDetailItemsToCSV(filename: string, items: DetailItem[]) {
  const headers = ['Principal', 'Secundario', 'Meta'];

  const rows = items.map((item) => [
    `"${(item.primary || '').replace(/"/g, '""')}"`,
    `"${(item.secondary || '').replace(/"/g, '""')}"`,
    `"${(item.meta || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const router = useRouter();

  /* =========================================================
     ESTADOS PRINCIPALES
     ========================================================= */
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeOption>('7days');

  /* =========================================================
     KPIs PRINCIPALES
     ========================================================= */
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalUserQuestions, setTotalUserQuestions] = useState(0);
  const [avgMessagesPerChat, setAvgMessagesPerChat] = useState(0);
  const [frequentQuestions, setFrequentQuestions] = useState<FrequentQuestion[]>([]);

  /* =========================================================
     CRECIMIENTO
     ========================================================= */
  const [messagesGrowth, setMessagesGrowth] = useState(0);
  const [sessionsGrowth, setSessionsGrowth] = useState(0);
  const [activeUsersGrowth, setActiveUsersGrowth] = useState(0);

  /* =========================================================
     GRAFICAS
     ========================================================= */
  const [messagesPerDay, setMessagesPerDay] = useState<DailyMessagesData[]>([]);
  const [sessionsPerDay, setSessionsPerDay] = useState<DailySessionsData[]>([]);
  const [activeUsersPerDay, setActiveUsersPerDay] = useState<DailyActiveUsersData[]>([]);
  const [topQuestionsChart, setTopQuestionsChart] = useState<TopQuestionChartData[]>([]);
  const [topUsers, setTopUsers] = useState<TopUserData[]>([]);

  /* =========================================================
     MODAL DE DETALLE
     ========================================================= */
  const [detailType, setDetailType] = useState<DetailType>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);

  /* =========================================================
     CARGA PRINCIPAL DE ANALITICA
     ========================================================= */
  useEffect(() => {
    const loadAnalytics = async () => {
      const currentUserInfo = localStorage.getItem('currentUser');

      if (!currentUserInfo) {
        router.push('/login');
        return;
      }

      const currentUser = JSON.parse(currentUserInfo);

      if (currentUser.role !== 'superUser') {
        router.push('/');
        return;
      }

      setLoading(true);

      try {
        const { startDate, endDate } = getDateRange(range);
        const {
          startDate: previousStartDate,
          endDate: previousEndDate,
        } = getPreviousDateRange(range);

        /* AQUI SE MANEJA EL TOTAL DE USUARIOS REGISTRADOS */
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        /* CONSULTAS BASE */
        let chatsQuery = supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true });

        let messagesQuery = supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true });

        let userQuestionsQuery = supabase
          .from('chat_messages')
          .select('content')
          .eq('role', 'user');

        let sessionsForUsersQuery = supabase
          .from('chat_sessions')
          .select('user_email, created_at');

        let messagesForChartQuery = supabase
          .from('chat_messages')
          .select('created_at');

        let previousMessagesQuery = supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true });

        let previousChatsQuery = supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true });

        let previousSessionsForUsersQuery = supabase
          .from('chat_sessions')
          .select('user_email');

        /* FILTROS PERIODO ACTUAL */
        if (startDate && endDate) {
          chatsQuery = chatsQuery.gte('created_at', startDate).lte('created_at', endDate);
          messagesQuery = messagesQuery.gte('created_at', startDate).lte('created_at', endDate);
          userQuestionsQuery = userQuestionsQuery
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          sessionsForUsersQuery = sessionsForUsersQuery
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          messagesForChartQuery = messagesForChartQuery
            .gte('created_at', startDate)
            .lte('created_at', endDate);
        }

        /* FILTROS PERIODO ANTERIOR */
        if (previousStartDate && previousEndDate) {
          previousMessagesQuery = previousMessagesQuery
            .gte('created_at', previousStartDate)
            .lte('created_at', previousEndDate);

          previousChatsQuery = previousChatsQuery
            .gte('created_at', previousStartDate)
            .lte('created_at', previousEndDate);

          previousSessionsForUsersQuery = previousSessionsForUsersQuery
            .gte('created_at', previousStartDate)
            .lte('created_at', previousEndDate);
        }

        /* EJECUCION EN PARALELO */
        const [
          { count: chatsCount },
          { count: messagesCount },
          { data: userQuestions },
          { data: sessionUsers },
          { data: messagesForChart },
          { count: previousMessagesCount },
          { count: previousChatsCount },
          { data: previousSessionUsers },
        ] = await Promise.all([
          chatsQuery,
          messagesQuery,
          userQuestionsQuery,
          sessionsForUsersQuery,
          messagesForChartQuery,
          previousMessagesQuery,
          previousChatsQuery,
          previousSessionsForUsersQuery,
        ]);

        /* USUARIOS ACTIVOS */
        const uniqueUsers = new Set(
          (sessionUsers || []).map((item) => item.user_email).filter(Boolean)
        );

        const previousUniqueUsers = new Set(
          (previousSessionUsers || []).map((item) => item.user_email).filter(Boolean)
        );

        setTotalUsers(usersCount || 0);
        setActiveUsers(uniqueUsers.size);
        setTotalChats(chatsCount || 0);
        setTotalMessages(messagesCount || 0);
        setTotalUserQuestions(userQuestions?.length || 0);

        /* PROMEDIO MENSAJES / CONVERSACION */
        const average =
          (chatsCount || 0) > 0 ? (messagesCount || 0) / (chatsCount || 0) : 0;
        setAvgMessagesPerChat(Number(average.toFixed(1)));

        /* CRECIMIENTO */
        setMessagesGrowth(calculateGrowth(messagesCount || 0, previousMessagesCount || 0));
        setSessionsGrowth(calculateGrowth(chatsCount || 0, previousChatsCount || 0));
        setActiveUsersGrowth(
          calculateGrowth(uniqueUsers.size, previousUniqueUsers.size)
        );

        /* PREGUNTAS MAS FRECUENTES */
        if (userQuestions) {
          const normalizedQuestions = userQuestions
            .map((item) => item.content.trim().toLowerCase())
            .filter((q) => q.length > 0);

          const counts: Record<string, number> = {};

          normalizedQuestions.forEach((question) => {
            counts[question] = (counts[question] || 0) + 1;
          });

          const sortedQuestions = Object.entries(counts)
            .map(([question, count]) => ({ question, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

          setFrequentQuestions(sortedQuestions);

          const chartQuestions = sortedQuestions.slice(0, 7).map((item) => ({
            question:
              item.question.length > 28
                ? `${item.question.slice(0, 28)}...`
                : item.question,
            count: item.count,
          }));

          setTopQuestionsChart(chartQuestions);
        } else {
          setFrequentQuestions([]);
          setTopQuestionsChart([]);
        }

        /* GRAFICA MENSAJES POR DIA */
        const messageCountByDate: Record<string, number> = {};
        (messagesForChart || []).forEach((item) => {
          const key = normalizeDateKey(item.created_at);
          messageCountByDate[key] = (messageCountByDate[key] || 0) + 1;
        });

        const messagesChartData = Object.entries(messageCountByDate).map(
          ([date, messages]) => ({
            date: formatShortDate(date),
            messages,
          })
        );

        setMessagesPerDay(messagesChartData);

        /* GRAFICA CONVERSACIONES POR DIA */
        const sessionCountByDate: Record<string, number> = {};

        /* GRAFICA USUARIOS ACTIVOS POR DIA */
        const usersByDate: Record<string, Set<string>> = {};

        /* TOP USUARIOS POR USO */
        const sessionsByUser: Record<string, number> = {};

        (sessionUsers || []).forEach((item) => {
          const key = normalizeDateKey(item.created_at);
          sessionCountByDate[key] = (sessionCountByDate[key] || 0) + 1;

          if (!usersByDate[key]) {
            usersByDate[key] = new Set();
          }

          if (item.user_email) {
            usersByDate[key].add(item.user_email);
            sessionsByUser[item.user_email] = (sessionsByUser[item.user_email] || 0) + 1;
          }
        });

        const sessionsChartData = Object.entries(sessionCountByDate).map(
          ([date, sessions]) => ({
            date: formatShortDate(date),
            sessions,
          })
        );

        setSessionsPerDay(sessionsChartData);

        const activeUsersChartData = Object.entries(usersByDate).map(
          ([date, userSet]) => ({
            date: formatShortDate(date),
            users: userSet.size,
          })
        );

        setActiveUsersPerDay(activeUsersChartData);

        const topUsersData = Object.entries(sessionsByUser)
          .map(([user_email, sessions]) => ({
            user_email,
            sessions,
          }))
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 5);

        setTopUsers(topUsersData);
      } catch (error) {
        console.error('Error cargando analítica:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [router, range]);

  /* =========================================================
     CERRAR MODAL
     ========================================================= */
  const handleCloseDetail = () => {
    setDetailType(null);
    setDetailTitle('');
    setDetailItems([]);
  };

  /* =========================================================
     ABRIR DETALLE DE TARJETAS
     ========================================================= */
  const handleOpenDetail = async (type: DetailType) => {
    if (!type) return;

    setDetailType(type);
    setDetailLoading(true);
    setDetailItems([]);

    try {
      const { startDate, endDate } = getDateRange(range);

      /* AQUI SE MANEJA USUARIOS REGISTRADOS */
      if (type === 'users') {
        setDetailTitle('Usuarios registrados');

        const { data } = await supabase
          .from('profiles')
          .select('email, carnet, role, created_at')
          .order('created_at', { ascending: false });

        const mapped = (data || []).map((item) => ({
          primary: item.carnet || 'Sin carnet',
          secondary: item.email || '',
          meta: `${item.role || ''} · ${formatDate(item.created_at)}`,
        }));

        setDetailItems(mapped);
      }

      /* AQUI SE MANEJA USUARIOS ACTIVOS */
      if (type === 'activeUsers') {
        setDetailTitle('Usuarios activos');

        let query = supabase
          .from('chat_sessions')
          .select('user_email, created_at')
          .order('created_at', { ascending: false });

        if (startDate && endDate) {
          query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data } = await query;

        const grouped: Record<string, { sessions: number; lastActivity: string }> = {};

        (data || []).forEach((item) => {
          if (!item.user_email) return;

          if (!grouped[item.user_email]) {
            grouped[item.user_email] = {
              sessions: 0,
              lastActivity: item.created_at,
            };
          }

          grouped[item.user_email].sessions += 1;

          if (new Date(item.created_at) > new Date(grouped[item.user_email].lastActivity)) {
            grouped[item.user_email].lastActivity = item.created_at;
          }
        });

        const mapped = Object.entries(grouped)
          .map(([email, info]) => ({
            primary: email,
            secondary: `${info.sessions} conversaciones`,
            meta: `Última actividad: ${formatDate(info.lastActivity)}`,
          }))
          .sort((a, b) => {
            const aSessions = Number(a.secondary?.split(' ')[0] || 0);
            const bSessions = Number(b.secondary?.split(' ')[0] || 0);
            return bSessions - aSessions;
          });

        setDetailItems(mapped);
      }

      /* AQUI SE MANEJAN CONVERSACIONES */
      if (type === 'sessions') {
        setDetailTitle('Conversaciones');

        let query = supabase
          .from('chat_sessions')
          .select('user_email, title, created_at, is_hidden')
          .order('created_at', { ascending: false });

        if (startDate && endDate) {
          query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data } = await query;

        const mapped = (data || []).map((item) => ({
          primary: item.title || 'Sin título',
          secondary: item.user_email || '',
          meta: `${formatDate(item.created_at)} · ${item.is_hidden ? 'Oculta' : 'Visible'}`,
        }));

        setDetailItems(mapped);
      }

      /* AQUI SE MANEJAN PREGUNTAS DE USUARIOS */
      if (type === 'questions') {
        setDetailTitle('Preguntas de usuarios');

        let query = supabase
          .from('chat_messages')
          .select('content, created_at, session_id')
          .eq('role', 'user')
          .order('created_at', { ascending: false });

        if (startDate && endDate) {
          query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data } = await query;

        const mapped = (data || []).map((item) => ({
          primary: item.content || '',
          secondary: `Sesión: ${item.session_id}`,
          meta: formatDate(item.created_at),
        }));

        setDetailItems(mapped);
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  /* =========================================================
     TEXTO LEGIBLE DEL FILTRO
     ========================================================= */
  const getRangeLabel = () => {
    switch (range) {
      case 'today':
        return 'Hoy';
      case '7days':
        return 'Últimos 7 días';
      case '30days':
        return 'Últimos 30 días';
      case 'month':
        return 'Este mes';
      case 'all':
        return 'Todo';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.centered}>Cargando dashboard...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.wrapper}>
        {/* ENCABEZADO */}
        <div className={styles.topBar}>
          <div className={styles.header}>
            <h1 className={styles.title}>Dashboard de Analítica</h1>
            <p className={styles.subtitle}>
              Resumen general de uso del chatbot y consultas frecuentes.
            </p>
          </div>

          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            Volver al chatbot
          </button>
        </div>

        {/* FILTROS */}
        <div className={styles.filtersRow}>
          <span className={styles.filterLabel}>Periodo:</span>

          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterBtn} ${range === 'today' ? styles.filterBtnActive : ''}`}
              onClick={() => setRange('today')}
            >
              Hoy
            </button>

            <button
              className={`${styles.filterBtn} ${range === '7days' ? styles.filterBtnActive : ''}`}
              onClick={() => setRange('7days')}
            >
              7 días
            </button>

            <button
              className={`${styles.filterBtn} ${range === '30days' ? styles.filterBtnActive : ''}`}
              onClick={() => setRange('30days')}
            >
              30 días
            </button>

            <button
              className={`${styles.filterBtn} ${range === 'month' ? styles.filterBtnActive : ''}`}
              onClick={() => setRange('month')}
            >
              Este mes
            </button>

            <button
              className={`${styles.filterBtn} ${range === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setRange('all')}
            >
              Todo
            </button>
          </div>
        </div>

        <div className={styles.rangeInfo}>
          Mostrando datos de: <strong>{getRangeLabel()}</strong>
        </div>

        {/* TARJETAS KPI */}
        <div className={styles.cardsGrid}>
          <button
            type="button"
            className={styles.cardButton}
            onClick={() => void handleOpenDetail('users')}
          >
            <div className={styles.card}>
              <h3 className={styles.cardLabel}>Usuarios registrados</h3>
              <p className={styles.cardValue}>{totalUsers}</p>
            </div>
          </button>

          <button
            type="button"
            className={styles.cardButton}
            onClick={() => void handleOpenDetail('activeUsers')}
          >
            <div className={styles.card}>
              <h3 className={styles.cardLabel}>Usuarios activos</h3>
              <p className={styles.cardValue}>{activeUsers}</p>
            </div>
          </button>

          <button
            type="button"
            className={styles.cardButton}
            onClick={() => void handleOpenDetail('sessions')}
          >
            <div className={styles.card}>
              <h3 className={styles.cardLabel}>Conversaciones</h3>
              <p className={styles.cardValue}>{totalChats}</p>
            </div>
          </button>

          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Mensajes</h3>
            <p className={styles.cardValue}>{totalMessages}</p>
          </div>

          <button
            type="button"
            className={styles.cardButton}
            onClick={() => void handleOpenDetail('questions')}
          >
            <div className={styles.card}>
              <h3 className={styles.cardLabel}>Preguntas de usuarios</h3>
              <p className={styles.cardValue}>{totalUserQuestions}</p>
            </div>
          </button>

          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Promedio mensajes / conversación</h3>
            <p className={styles.cardValue}>{avgMessagesPerChat}</p>
          </div>
        </div>

        {/* CRECIMIENTO */}
        <div className={styles.growthGrid}>
          <div className={styles.growthCard}>
            <span className={styles.growthLabel}>Crecimiento de mensajes</span>
            <span className={styles.growthValue}>{formatGrowthLabel(messagesGrowth)}</span>
          </div>

          <div className={styles.growthCard}>
            <span className={styles.growthLabel}>Crecimiento de conversaciones</span>
            <span className={styles.growthValue}>{formatGrowthLabel(sessionsGrowth)}</span>
          </div>

          <div className={styles.growthCard}>
            <span className={styles.growthLabel}>Crecimiento de usuarios activos</span>
            <span className={styles.growthValue}>{formatGrowthLabel(activeUsersGrowth)}</span>
          </div>
        </div>

        {/* GRAFICAS PRINCIPALES */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.sectionTitle}>Mensajes por día</h2>
            </div>

            {messagesPerDay.length === 0 ? (
              <div className={styles.emptyBox}>
                No hay suficientes datos para mostrar esta gráfica.
              </div>
            ) : (
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={messagesPerDay}>
                    <defs>
                      <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#111111" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddddda" />
                    <XAxis dataKey="date" stroke="#6b6b6b" />
                    <YAxis allowDecimals={false} stroke="#6b6b6b" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke="#111111"
                      strokeWidth={2}
                      fill="url(#messagesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.sectionTitle}>Conversaciones por día</h2>
            </div>

            {sessionsPerDay.length === 0 ? (
              <div className={styles.emptyBox}>
                No hay suficientes datos para mostrar esta gráfica.
              </div>
            ) : (
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sessionsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddddda" />
                    <XAxis dataKey="date" stroke="#6b6b6b" />
                    <YAxis allowDecimals={false} stroke="#6b6b6b" />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#1f1f1f" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* GRAFICAS SECUNDARIAS */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.sectionTitle}>Usuarios activos por día</h2>
            </div>

            {activeUsersPerDay.length === 0 ? (
              <div className={styles.emptyBox}>
                No hay suficientes datos para mostrar esta gráfica.
              </div>
            ) : (
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activeUsersPerDay}>
                    <defs>
                      <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#111111" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddddda" />
                    <XAxis dataKey="date" stroke="#6b6b6b" />
                    <YAxis allowDecimals={false} stroke="#6b6b6b" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#111111"
                      strokeWidth={2}
                      fill="url(#activeUsersGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.sectionTitle}>Top usuarios por uso</h2>
            </div>

            {topUsers.length === 0 ? (
              <div className={styles.emptyBox}>
                No hay suficientes datos para mostrar esta gráfica.
              </div>
            ) : (
              <div className={styles.topUsersList}>
                {topUsers.map((user, index) => (
                  <div key={index} className={styles.topUserItem}>
                    <div>
                      <div className={styles.topUserEmail}>{user.user_email}</div>
                      <div className={styles.topUserMeta}>Conversaciones registradas</div>
                    </div>
                    <div className={styles.topUserCount}>{user.sessions}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TABLA PREGUNTAS FRECUENTES */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preguntas más frecuentes</h2>

          {frequentQuestions.length === 0 ? (
            <div className={styles.emptyBox}>
              No hay suficientes datos para mostrar preguntas frecuentes en este periodo.
            </div>
          ) : (
            <div className={styles.tableBox}>
              {frequentQuestions.map((item, index) => (
                <div key={index} className={styles.tableRow}>
                  <div className={styles.questionText}>{item.question}</div>
                  <div className={styles.questionCount}>{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GRAFICA TOP PREGUNTAS */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.sectionTitle}>Top preguntas frecuentes</h2>
          </div>

          {topQuestionsChart.length === 0 ? (
            <div className={styles.emptyBox}>
              No hay suficientes datos para mostrar esta gráfica.
            </div>
          ) : (
            <div className={styles.chartContainerTall}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={topQuestionsChart}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddddda" />
                  <XAxis type="number" allowDecimals={false} stroke="#6b6b6b" />
                  <YAxis
                    type="category"
                    dataKey="question"
                    width={220}
                    stroke="#6b6b6b"
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#111111" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* MODAL + EXPORTAR CSV */}
      {detailType && (
        <div className={styles.modalOverlay} onClick={handleCloseDetail}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{detailTitle}</h2>
                <p className={styles.modalSubtitle}>
                  Detalle correspondiente al periodo: {getRangeLabel()}
                </p>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={() =>
                    exportDetailItemsToCSV(
                      `${detailTitle.toLowerCase().replace(/\s+/g, '_')}.csv`,
                      detailItems
                    )
                  }
                  disabled={detailItems.length === 0}
                >
                  Exportar CSV
                </button>

                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={handleCloseDetail}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.modalBody}>
              {detailLoading ? (
                <div className={styles.emptyBox}>Cargando detalle...</div>
              ) : detailItems.length === 0 ? (
                <div className={styles.emptyBox}>No hay datos para mostrar.</div>
              ) : (
                <div className={styles.detailList}>
                  {detailItems.map((item, index) => (
                    <div key={index} className={styles.detailItem}>
                      <div className={styles.detailPrimary}>{item.primary}</div>
                      {item.secondary && (
                        <div className={styles.detailSecondary}>{item.secondary}</div>
                      )}
                      {item.meta && (
                        <div className={styles.detailMeta}>{item.meta}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}