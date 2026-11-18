/**
 * NotificationsPage.jsx — Smart Lost & Found
 * Dashboard de notifications haute fidélité (Linear / Raycast / Apple style)
 * - Layout Split 2 colonnes (65% liste cartes de correspondance, 35% panneau d'inspection sticky)
 * - Visualisation Match : [Objet Perdu #X] <--- Jauge SVG animée ---> [Objet Trouvé #Y]
 * - Panneau d'inspection en direct sans modale basique (Tiroir drawer fluide sur mobile)
 * - KPI Cards modernes, Recherche instantanée, Menu de tri, Modale Préférences
 * - Skeleton loaders, Empty states illustrés, Toasts
 * - 100% compatible avec notificationService.js
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Eye, Check, RefreshCw,
  Search, SlidersHorizontal, Settings, X, AlertTriangle,
  TrendingUp, Inbox, ArrowRight, Sparkles, Filter,
  Layers, CheckCircle2, ShieldCheck, Zap, HelpCircle,
  ExternalLink, ChevronRight, Clock,
} from 'lucide-react';

import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatRelativeTime,
  useNotificationPolling,
} from '../services/notificationService';

// ── Métadonnées et couleurs selon score ──
const getScoreDetails = (score) => {
  if (score == null) {
    return {
      color: '#6366F1',
      bgLight: '#EEF2FF',
      borderLight: '#C7D2FE',
      tier: 'Détection standard',
      confidenceText: 'Correspondance en cours d’évaluation',
    };
  }
  if (score >= 90) {
    return {
      color: '#059669',
      bgLight: '#ECFDF5',
      borderLight: '#A7F3D0',
      tier: 'Confiance Élevée',
      confidenceText: 'Forte certitude de correspondance sémantique',
    };
  }
  if (score >= 75) {
    return {
      color: '#D97706',
      bgLight: '#FFFBEB',
      borderLight: '#FDE68A',
      tier: 'Confiance Moyenne',
      confidenceText: 'Bonne similarité des attributs',
    };
  }
  return {
    color: '#2563EB',
    bgLight: '#EFF6FF',
    borderLight: '#BFDBFE',
    tier: 'Correspondance Partielle',
    confidenceText: 'Certains attributs concordent',
  };
};

// ── Composant Jauge Circulaire SVG (Taille variable) ──
const CircularGauge = ({ score, size = 44, strokeWidth = 4, showLabel = true }) => {
  const meta = getScoreDetails(score);
  const val = score != null ? Math.min(100, Math.max(0, score)) : 0;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (val / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {showLabel && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: size >= 70 ? '1.25rem' : '0.72rem', fontWeight: 800, color: meta.color }}>
            {score != null ? `${score.toFixed(size >= 70 ? 1 : 0)}` : '—'}
          </span>
          {size >= 70 && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>%</span>
          )}
        </div>
      )}
    </div>
  );
};

// ── Styles CSS injectés ──
const PAGE_CSS = `
  /* ── Grille 2 colonnes Dashboard ── */
  .slf-split-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.5rem;
    align-items: flex-start;
  }
  @media (max-width: 992px) {
    .slf-split-layout {
      grid-template-columns: 1fr;
    }
    .slf-inspection-panel.desktop-only {
      display: none !important;
    }
  }

  /* ── KPI Card ── */
  .slf-kpi-modern {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 16px;
    padding: 1.1rem 1.35rem;
    display: flex; align-items: center; gap: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 6px 16px -4px rgba(0, 0, 0, 0.04);
    flex: 1; min-width: 160px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .slf-kpi-modern:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08);
  }

  /* ── Carte de Correspondance (Match Card) ── */
  .slf-match-card {
    position: relative;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 16px;
    padding: 1.15rem 1.35rem 1.15rem 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .slf-match-card:hover {
    background: #FFFFFF;
    border-color: #CBD5E1;
    box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.09);
    transform: translateY(-1px);
  }
  .slf-match-card.selected {
    background: #FFFFFF;
    border-color: #6366F1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2), 0 12px 28px -6px rgba(99, 102, 241, 0.14);
  }
  .slf-match-card.unread {
    background: #F9FAFF;
  }
  .slf-match-card-lateral {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 5px;
    transition: width 0.2s ease;
  }
  .slf-match-card:hover .slf-match-card-lateral {
    width: 7px;
  }

  /* ── Raccordement visuel entre objets ── */
  .slf-match-bridge {
    display: flex; align-items: center; gap: 0.6rem;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 0.45rem 0.75rem;
    margin: 0.75rem 0;
  }
  .slf-item-tag {
    display: flex; align-items: center; gap: 0.35rem;
    font-size: 0.75rem; font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 7px;
    letter-spacing: -0.01em;
  }
  .slf-item-tag.lost {
    background: #EFF6FF; color: #1D4ED8; border: 1px solid #DBEAFE;
  }
  .slf-item-tag.found {
    background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0;
  }
  .slf-bridge-connector {
    flex: 1; height: 1px;
    background: repeating-linear-gradient(90deg, #CBD5E1, #CBD5E1 4px, transparent 4px, transparent 8px);
  }

  /* ── Panneau d'inspection sticky ── */
  .slf-inspection-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.08);
    position: sticky;
    top: calc(3.5rem + 1.5rem);
  }

  /* ── Drawer Mobile ── */
  .slf-drawer-overlay {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    z-index: 1100;
    display: flex; justify-content: flex-end;
  }
  .slf-drawer-content {
    width: 420px; max-width: 90vw;
    background: #FFFFFF;
    height: 100%;
    padding: 1.75rem;
    overflow-y: auto;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
    animation: drawer-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Boutons d'action ── */
  .slf-action-btn {
    border: 1px solid #E2E8F0;
    background: #FFFFFF;
    border-radius: 8px;
    padding: 0.38rem 0.65rem;
    font-size: 0.78rem; font-weight: 700;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 0.35rem;
    color: #475569;
    transition: all 0.15s ease;
  }
  .slf-action-btn:hover {
    background: #F8FAFC; border-color: #CBD5E1; color: #0F172A;
  }
  .slf-action-btn.primary {
    background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
    color: #FFFFFF; border-color: transparent;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  }
  .slf-action-btn.primary:hover {
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }
  .slf-action-btn.success:hover {
    background: #ECFDF5; border-color: #A7F3D0; color: #059669;
  }
  .slf-action-btn.danger:hover {
    background: #FEF2F2; border-color: #FECACA; color: #DC2626;
  }
  .slf-action-btn:disabled {
    opacity: 0.55; cursor: not-allowed; transform: none !important;
  }

  /* ── Skeleton ── */
  .slf-skeleton-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 0.9rem;
  }
  .slf-sk-line {
    height: 14px;
    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 6px;
  }

  /* ── Modale Préférences Glassmorphism ── */
  .slf-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    z-index: 1200;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }
  .slf-modal-box {
    background: #FFFFFF;
    border-radius: 20px;
    width: 100%; max-width: 440px;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
    overflow: hidden;
    animation: popover-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .slf-toggle-switch {
    width: 44px; height: 24px;
    background: #CBD5E1; border: none; border-radius: 999px;
    position: relative; cursor: pointer;
    transition: background 0.2s ease;
  }
  .slf-toggle-switch.active { background: #4F46E5; }
  .slf-toggle-switch::after {
    content: ''; position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #FFFFFF; transition: transform 0.2s ease;
  }
  .slf-toggle-switch.active::after { transform: translateX(20px); }
`;

if (typeof document !== 'undefined' && !document.getElementById('slf-page-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'slf-page-styles';
  styleEl.textContent = PAGE_CSS;
  document.head.appendChild(styleEl);
}

// ── Gestion du stockage LocalStorage pour les préférences ──
const PREFS_KEY = 'smart_lost_found_prefs';
const loadPreferences = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
};

// ── Composant d'état vide ──
const EmptyNotificationState = ({ activeFilter, hasSearchOrFilter, onResetFilters }) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        border: '1px dashed #CBD5E1',
        borderRadius: 20,
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 58, height: 58, borderRadius: 16,
          background: '#F1F5F9', color: '#94A3B8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}
      >
        {hasSearchOrFilter ? <Search size={26} /> : <Inbox size={26} />}
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
        {hasSearchOrFilter
          ? 'Aucun résultat correspondant'
          : activeFilter === 'unread'
          ? 'Toutes les notifications sont lues'
          : activeFilter === 'read'
          ? 'Aucune notification archivée'
          : 'Aucune notification reçue'}
      </h3>
      <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: 360, margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
        {hasSearchOrFilter
          ? 'Essayez de modifier votre recherche ou d’ajuster le seuil de score minimal.'
          : activeFilter === 'unread'
          ? 'Vous êtes à jour ! Dès qu’un objet perdu trouvera preneur, une alerte apparaîtra ici.'
          : 'Les alertes générées par le microservice de matching apparaîtront en temps réel.'}
      </p>
      {hasSearchOrFilter && (
        <button
          type="button"
          onClick={onResetFilters}
          className="slf-action-btn primary"
          style={{ margin: '0 auto' }}
        >
          <RefreshCw size={13} />
          <span>Réinitialiser les filtres</span>
        </button>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════════════
const NotificationsPage = ({
  notifications: sharedNotifications,
  setNotifications: sharedSetNotifications,
  loading: sharedLoading,
  error: sharedError,
  onRefresh,
  userId = 1,
}) => {
  const navigate = useNavigate();

  // État local de secours
  const [localNotifications, setLocalNotifications] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState(null);

  const notifications = sharedNotifications !== undefined ? sharedNotifications : localNotifications;
  const setNotifications = sharedSetNotifications !== undefined ? sharedSetNotifications : setLocalNotifications;
  const loading = sharedLoading !== undefined ? sharedLoading : localLoading;
  const error = sharedError !== undefined ? sharedError : localError;

  // États UI
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' | 'score'
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  // Préférences utilisateur
  const [prefs, setPrefs] = useState(() => ({
    toastsEnabled: true,
    minMatchScore: 0,
    ...loadPreferences(),
  }));

  const updatePreferences = (newPrefs) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch {
      /* silent */
    }
  };

  // Polling autonome si non alimenté par App.jsx
  const handleUpdate = useCallback((data) => {
    setLocalNotifications(data);
    setLocalLoading(false);
    setLocalError(null);
  }, []);

  const handleError = useCallback((err) => {
    setLocalLoading(false);
    setLocalError(err.message || 'Impossible de joindre le microservice de notifications.');
  }, []);

  useNotificationPolling(
    sharedNotifications !== undefined ? null : userId,
    handleUpdate,
    null,
    5000,
    handleError
  );

  // KPIs
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = totalCount - unreadCount;
  const validScores = notifications
    .map((n) => n.score ?? n.matchScore)
    .filter((s) => s != null && typeof s === 'number');
  const averageScore = validScores.length > 0
    ? validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
    : null;
  const highConfidenceCount = validScores.filter((s) => s >= 80).length;

  // Filtrage et Tri
  const filteredNotifications = useMemo(() => {
    let list = notifications;

    // Filtre statut
    if (activeFilter === 'unread') list = list.filter((n) => !n.read);
    if (activeFilter === 'read')   list = list.filter((n) => n.read);

    // Filtre score minimal
    if (prefs.minMatchScore > 0) {
      list = list.filter((n) => {
        const s = n.score ?? n.matchScore;
        return s == null || s >= prefs.minMatchScore;
      });
    }

    // Filtre recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((n) => {
        const msg = (n.message || '').toLowerCase();
        const lost = String(n.lostItemId || '');
        const found = String(n.foundItemId || '');
        return msg.includes(q) || lost.includes(q) || found.includes(q);
      });
    }

    // Tri
    if (sortOrder === 'score') {
      list = [...list].sort((a, b) => {
        const sa = a.score ?? a.matchScore ?? -1;
        const sb = b.score ?? b.matchScore ?? -1;
        return sb - sa;
      });
    } else {
      // 'recent' : date la plus récente en premier
      list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [notifications, activeFilter, prefs.minMatchScore, searchQuery, sortOrder]);

  const hasActiveFilters = searchQuery.trim() !== '' || prefs.minMatchScore > 0;

  // Détermination de la notification sélectionnée
  const activeSelected = useMemo(() => {
    if (!selectedNotificationId) return null;
    return notifications.find((n) => n.id === selectedNotificationId) || null;
  }, [notifications, selectedNotificationId]);

  // Actions API
  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: updated.read ?? true } : n))
      );
    } catch {
      /* silent */
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Voulez-vous supprimer définitivement cette notification ?')) return;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (selectedNotificationId === id) setSelectedNotificationId(null);
    } catch {
      /* silent */
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setGlobalLoading(true);
    try {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* silent */
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* ── En-tête Titre & Actions Générales ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
              Centre de Notifications
            </h1>
            <span
              style={{
                fontSize: '0.72rem', fontWeight: 700,
                background: '#EEF2FF', color: '#4F46E5',
                border: '1px solid #C7D2FE', borderRadius: 999,
                padding: '0.15rem 0.6rem',
              }}
            >
              Utilisateur #{userId}
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0.3rem 0 0' }}>
            Correspondances d'objets détectées par le moteur d'intelligence artificielle.
          </p>
        </div>

        {/* Boutons d'actions globales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="slf-action-btn"
            onClick={() => setShowPreferencesModal(true)}
            title="Paramètres d'alertes"
          >
            <Settings size={15} />
            <span>Préférences</span>
          </button>

          <button
            type="button"
            className="slf-action-btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || globalLoading || loading}
            title="Tout marquer comme lu"
          >
            {globalLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" style={{ width: 13, height: 13 }} />
            ) : (
              <CheckCheck size={15} />
            )}
            <span>Tout marquer lu</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              className="slf-action-btn"
              onClick={onRefresh}
              title="Rafraîchir les données"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Bandeau d'Erreur Réseau éventuelle ── */}
      {error && (
        <div
          style={{
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 14, padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            marginBottom: '1.5rem', color: '#92400E',
          }}
        >
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, fontSize: '0.85rem' }}>
            <strong>Erreur de communication :</strong> {error}
            <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '0.2rem' }}>
              Vérifiez que <code>api-gateway</code> (port 8085) et <code>notification-service</code> (port 8083) sont bien actifs.
            </div>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="slf-action-btn"
              style={{ background: '#FFFFFF', borderColor: '#FDE68A', color: '#92400E' }}
            >
              <RefreshCw size={12} />
              <span>Réessayer</span>
            </button>
          )}
        </div>
      )}

      {/* ── KPI Cards (3 Colonnes) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* Total reçues */}
        <div className="slf-kpi-modern">
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bell size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
              Total des alertes
            </div>
          </div>
        </div>

        {/* Non lues */}
        <div className="slf-kpi-modern">
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#FEF2F2', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            <span
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#EF4444', display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.25)',
                animation: 'dot-pulse 1.8s infinite',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>
              {unreadCount}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
              Non lues
            </div>
          </div>
        </div>

        {/* Score moyen */}
        <div className="slf-kpi-modern">
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#ECFDF5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>
              {averageScore != null ? `${averageScore.toFixed(1)}%` : '—'}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
              Score moyen IA
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de Contrôle : Filtres par Onglet + Recherche + Tri ── */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: 16, padding: '0.65rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem',
        }}
      >
        {/* Onglets statut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {[
            { key: 'all',    label: 'Toutes',   count: totalCount },
            { key: 'unread', label: 'Non lues', count: unreadCount },
            { key: 'read',   label: 'Lues',     count: readCount },
          ].map(({ key, label, count }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                style={{
                  background: isActive ? '#4F46E5' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  border: 'none', borderRadius: 999,
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.82rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <span>{label}</span>
                <span
                  style={{
                    fontSize: '0.68rem', fontWeight: 800,
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#475569',
                    padding: '0.05rem 0.45rem', borderRadius: 999,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recherche instantanée & Tri */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Champ recherche */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14} color="#94A3B8"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Rechercher (mot-clé, #id)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10, padding: '0.42rem 0.85rem 0.42rem 2.1rem',
                fontSize: '0.82rem', outline: 'none', width: 220,
                color: '#0F172A',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366F1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sélecteur de Tri */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: 10, padding: '0.42rem 0.75rem',
              fontSize: '0.82rem', fontWeight: 600, color: '#334155',
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="recent">Plus récentes</option>
            <option value="score">Meilleur score</option>
          </select>
        </div>
      </div>

      {/* Badge indicateur de filtre de score actif */}
      {prefs.minMatchScore > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#64748B' }}>
          <SlidersHorizontal size={13} color="#4F46E5" />
          <span>Filtre score appliqué : <strong>≥ {prefs.minMatchScore}%</strong></span>
          <button
            type="button"
            onClick={() => updatePreferences({ minMatchScore: 0 })}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: 999,
              padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 700,
              color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <X size={11} />
            <span>Réinitialiser</span>
          </button>
        </div>
      )}

      {/* ── Disposition Split 2 Colonnes ── */}
      <div className="slf-split-layout">
        {/* ── Colonne Gauche (65%) : Liste des Match Cards ── */}
        <div>
          {/* Skeleton de chargement */}
          {loading && !error && (
            <div>
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="slf-skeleton-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="slf-sk-line" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="slf-sk-line" style={{ width: '40%', marginBottom: 6 }} />
                      <div className="slf-sk-line" style={{ width: '25%' }} />
                    </div>
                  </div>
                  <div className="slf-sk-line" style={{ width: '85%', marginBottom: 8 }} />
                  <div className="slf-sk-line" style={{ width: '60%' }} />
                </div>
              ))}
            </div>
          )}

          {/* État vide */}
          {!loading && filteredNotifications.length === 0 && (
            <EmptyNotificationState
              activeFilter={activeFilter}
              hasSearchOrFilter={hasActiveFilters}
              onResetFilters={() => {
                setSearchQuery('');
                updatePreferences({ minMatchScore: 0 });
              }}
            />
          )}

          {/* Liste des Cartes de Correspondance */}
          {!loading && filteredNotifications.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredNotifications.map((notif) => {
                const score = notif.score ?? notif.matchScore;
                const scoreMeta = getScoreDetails(score);
                const isSelected = selectedNotificationId === notif.id;
                const isLoading = actionLoading[notif.id];

                return (
                  <div
                    key={notif.id}
                    className={`slf-match-card${!notif.read ? ' unread' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedNotificationId(notif.id)}
                  >
                    {/* Barre latérale colorée selon score */}
                    <div
                      className="slf-match-card-lateral"
                      style={{ background: scoreMeta.color }}
                    />

                    {/* Ligne haute : Statut + Date + Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {!notif.read ? (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              background: '#EFF6FF', color: '#1D4ED8',
                              fontSize: '0.68rem', fontWeight: 800,
                              borderRadius: 999, padding: '0.12rem 0.55rem',
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
                            Nouveau
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} color="#10B981" />
                            Vu
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.7rem', fontWeight: 700,
                            color: scoreMeta.color,
                            background: scoreMeta.bgLight,
                            border: `1px solid ${scoreMeta.borderLight}`,
                            borderRadius: 6, padding: '0.08rem 0.45rem',
                          }}
                        >
                          {scoreMeta.tier}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                      </div>
                    </div>

                    {/* Message principal */}
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                      {notif.message}
                    </div>

                    {/* Mini-visualisation Match : [Objet Perdu #12] <--- Jauge SVG ---> [Objet Trouvé #34] */}
                    <div className="slf-match-bridge">
                      <div className="slf-item-tag lost">
                        <span>Perdu</span>
                        <strong>#{notif.lostItemId || '—'}</strong>
                      </div>

                      <div className="slf-bridge-connector" />

                      {/* Jauge circulaire SVG centrale */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CircularGauge score={score} size={38} strokeWidth={3.5} />
                      </div>

                      <div className="slf-bridge-connector" />

                      <div className="slf-item-tag found">
                        <span>Trouvé</span>
                        <strong>#{notif.foundItemId || '—'}</strong>
                      </div>
                    </div>

                    {/* Barre d'actions au survol / en pied de carte */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        Cliquez pour inspecter la correspondance
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        {/* Bouton Voir le match / Inspecter */}
                        <button
                          type="button"
                          className="slf-action-btn primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotificationId(notif.id);
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspecter</span>
                        </button>

                        {/* Bouton Marquer lu */}
                        {!notif.read && (
                          <button
                            type="button"
                            className="slf-action-btn success"
                            onClick={(e) => handleMarkRead(notif.id, e)}
                            disabled={isLoading}
                            title="Marquer comme lu"
                          >
                            <Check size={13} />
                          </button>
                        )}

                        {/* Bouton Supprimer */}
                        <button
                          type="button"
                          className="slf-action-btn danger"
                          onClick={(e) => handleDelete(notif.id, e)}
                          disabled={isLoading}
                          title="Supprimer cette alerte"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Colonne Droite (35%, Sticky Desktop) : Panneau d'Inspection / Statistiques ── */}
        <div className="slf-inspection-panel desktop-only">
          {activeSelected ? (
            /* Mode Inspection d'une notification sélectionnée */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="#4F46E5" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                    Inspection du Match
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotificationId(null)}
                  style={{
                    background: 'none', border: 'none', color: '#94A3B8',
                    cursor: 'pointer', padding: 4, borderRadius: 6,
                  }}
                  title="Fermer l'inspection"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Jauge Grand Format */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
                  borderRadius: 16, padding: '1.25rem',
                  textAlign: 'center', marginBottom: '1.25rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <CircularGauge
                    score={activeSelected.score ?? activeSelected.matchScore}
                    size={84}
                    strokeWidth={6}
                  />
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {getScoreDetails(activeSelected.score ?? activeSelected.matchScore).tier}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                  {getScoreDetails(activeSelected.score ?? activeSelected.matchScore).confidenceText}
                </div>
              </div>

              {/* Détails des Objets Perdu ↔ Trouvé */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '0.75rem', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>
                    Objet Perdu
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E40AF', marginTop: 2 }}>
                    #{activeSelected.lostItemId || '—'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>Déclaré perdu</div>
                </div>

                <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '0.75rem', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                    Objet Trouvé
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065F46', marginTop: 2 }}>
                    #{activeSelected.foundItemId || '—'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>Correspondant</div>
                </div>
              </div>

              {/* Message complet */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>
                  Message de l'événement :
                </div>
                <div
                  style={{
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: 10, padding: '0.75rem 0.85rem',
                    fontSize: '0.84rem', color: '#334155', lineHeight: 1.5,
                  }}
                >
                  {activeSelected.message}
                </div>
              </div>

              {/* Horodatage & Statut */}
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>Date : <strong>{formatRelativeTime(activeSelected.createdAt)}</strong></div>
                <div>Statut : <strong>{activeSelected.read ? 'Lu' : 'Non lu'}</strong></div>
              </div>

              {/* Bouton d'action "Voir la page du match" */}
              {activeSelected.lostItemId && activeSelected.foundItemId && (
                <Link
                  to={`/matches/${activeSelected.lostItemId}/${activeSelected.foundItemId}`}
                  className="slf-action-btn primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem', textDecoration: 'none', marginBottom: '0.6rem' }}
                >
                  <ExternalLink size={15} />
                  <span>Confirmer la correspondance</span>
                </Link>
              )}

              {!activeSelected.read && (
                <button
                  type="button"
                  className="slf-action-btn success"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.55rem 1rem' }}
                  onClick={() => handleMarkRead(activeSelected.id)}
                >
                  <Check size={14} />
                  <span>Marquer comme lu</span>
                </button>
              )}
            </div>
          ) : (
            /* Mode Statistiques en direct & Résumé IA */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={18} color="#4F46E5" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                  Performances de Matching
                </span>
              </div>

              {/* Carte Score Global */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #FAFAFE 100%)',
                  borderRadius: 16, padding: '1.25rem',
                  border: '1px solid #C7D2FE',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>
                  Précision globale du moteur
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                  {averageScore != null ? `${averageScore.toFixed(1)}%` : '—'}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.4rem 0 0', lineHeight: 1.4 }}>
                  Moyenne pondérée des similarités sémantiques sur les correspondances détectées.
                </p>
              </div>

              {/* Raccourcis de filtres rapides */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>
                  Filtres rapides :
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <button
                    type="button"
                    onClick={() => updatePreferences({ minMatchScore: 80 })}
                    className="slf-action-btn"
                    style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem' }}
                  >
                    <span>Matchs haute confiance (≥ 80%)</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>{highConfidenceCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('unread')}
                    className="slf-action-btn"
                    style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem' }}
                  >
                    <span>Alertes non lues</span>
                    <span style={{ fontWeight: 800, color: '#DC2626' }}>{unreadCount}</span>
                  </button>
                </div>
              </div>

              {/* Statut du système */}
              <div
                style={{
                  background: '#F8FAFC', borderRadius: 12,
                  padding: '0.85rem 1rem', border: '1px solid #E2E8F0',
                  fontSize: '0.75rem', color: '#64748B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 700, marginBottom: '0.2rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                  Système actif · Polling 5s
                </div>
                <div>Queue RabbitMQ : <code>notification.match.queue</code></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer Mobile / Tablette pour l'inspection ── */}
      {activeSelected && (
        <div
          className="slf-drawer-overlay d-lg-none"
          onClick={() => setSelectedNotificationId(null)}
        >
          <div className="slf-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Détail du Match
              </span>
              <button
                type="button"
                onClick={() => setSelectedNotificationId(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Jauge */}
            <div style={{ textAlign: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: 16, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <CircularGauge
                  score={activeSelected.score ?? activeSelected.matchScore}
                  size={76}
                  strokeWidth={5}
                />
              </div>
              <div style={{ fontWeight: 800, color: '#0F172A' }}>
                {getScoreDetails(activeSelected.score ?? activeSelected.matchScore).tier}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>
                Description :
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '0.75rem', fontSize: '0.85rem' }}>
                {activeSelected.message}
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeSelected.lostItemId && activeSelected.foundItemId && (
                <Link
                  to={`/matches/${activeSelected.lostItemId}/${activeSelected.foundItemId}`}
                  className="slf-action-btn primary"
                  style={{ justifyContent: 'center', padding: '0.65rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Confirmer la correspondance</span>
                </Link>
              )}
              {!activeSelected.read && (
                <button
                  type="button"
                  className="slf-action-btn success"
                  style={{ justifyContent: 'center', padding: '0.55rem' }}
                  onClick={() => handleMarkRead(activeSelected.id)}
                >
                  <Check size={14} />
                  <span>Marquer comme lu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Préférences d'Alerte (Sauvegardée dans LocalStorage) ── */}
      {showPreferencesModal && (
        <div className="slf-modal-overlay" onClick={() => setShowPreferencesModal(false)}>
          <div className="slf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '1.1rem 1.4rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} color="#4F46E5" />
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Préférences d'Alerte
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.4rem' }}>
              {/* Toggle Toasts */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    Notifications Toast en direct
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                    Afficher un toast flottant lors d'une nouvelle correspondance
                  </div>
                </div>
                <button
                  type="button"
                  className={`slf-toggle-switch${prefs.toastsEnabled ? ' active' : ''}`}
                  onClick={() => updatePreferences({ toastsEnabled: !prefs.toastsEnabled })}
                  aria-label="Activer ou désactiver les toasts"
                />
              </div>

              {/* Slider Seuil de Score */}
              <div style={{ paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    Seuil minimum de correspondance
                  </div>
                  <span
                    style={{
                      fontSize: '0.85rem', fontWeight: 800,
                      color: '#4F46E5', background: '#EEF2FF',
                      padding: '0.1rem 0.5rem', borderRadius: 6,
                    }}
                  >
                    {prefs.minMatchScore}%
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '0.9rem' }}>
                  Masquer automatiquement les notifications avec un score inférieur.
                </p>
                <input
                  type="range"
                  min="0"
                  max="95"
                  step="5"
                  value={prefs.minMatchScore}
                  onChange={(e) => updatePreferences({ minMatchScore: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#4F46E5', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                  <span>Tout afficher (0%)</span>
                  <span>Strict (80%)</span>
                  <span>Exact (95%)</span>
                </div>
              </div>

              {/* Bouton fermeture */}
              <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
                <button
                  type="button"
                  className="slf-action-btn primary"
                  style={{ padding: '0.55rem 1.25rem' }}
                  onClick={() => setShowPreferencesModal(false)}
                >
                  <Check size={14} />
                  <span>Enregistrer et fermer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
