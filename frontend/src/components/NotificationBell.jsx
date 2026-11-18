/**
 * NotificationBell.jsx — Smart Lost & Found
 * Cloche de notification moderne SaaS (Linear / Apple style)
 * - Badge animé avec pulsation
 * - Popover flottant glassmorphic avec en-tête dégradé subtil
 * - Indicateur "En direct" pulsant
 * - Mini-jauges de score circulaires SVG
 * - Action rapide "Tout marquer lu" intégrée
 * - 100% compatible avec notificationService.js
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Check, Clock, Sparkles, ExternalLink, Inbox } from 'lucide-react';
import { formatRelativeTime } from '../services/notificationService';

// ── Helper couleur selon score ──
const getScoreMeta = (score) => {
  if (score == null) return { color: '#64748B', bg: '#F1F5F9', label: 'N/A' };
  if (score >= 90)   return { color: '#059669', bg: '#ECFDF5', label: 'Excellent' };
  if (score >= 75)   return { color: '#D97706', bg: '#FFFBEB', label: 'Bon' };
  return               { color: '#2563EB', bg: '#EFF6FF', label: 'Moyen' };
};

// ── Mini Jauge Circulaire SVG pour le Popover ──
const MiniCircleGauge = ({ score }) => {
  const meta = getScoreMeta(score);
  const val = score != null ? Math.min(100, Math.max(0, score)) : 0;
  const radius = 12;
  const circumference = 2 * Math.PI * radius; // ~75.4
  const strokeDashoffset = circumference - (val / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
        {/* Cercle de fond */}
        <circle
          cx="16" cy="16" r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3"
        />
        {/* Cercle de progression */}
        <circle
          cx="16" cy="16" r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.62rem', fontWeight: 800, color: meta.color,
          letterSpacing: '-0.02em',
        }}
      >
        {score != null ? Math.round(score) : '—'}
      </div>
    </div>
  );
};

// ── Styles CSS injectés pour la cloche ──
const BELL_CSS = `
  .slf-bell-trigger {
    position: relative;
    width: 38px; height: 38px;
    border-radius: 10px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    color: #475569;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .slf-bell-trigger:hover {
    background: #FFFFFF;
    color: #0F172A;
    border-color: #C7D2FE;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.15);
    transform: translateY(-1px);
  }
  .slf-bell-trigger.ringing .bell-svg {
    animation: ring 0.65s ease-in-out;
  }
  .slf-bell-badge {
    position: absolute;
    top: -4px; right: -4px;
    min-width: 18px; height: 18px;
    padding: 0 4px;
    border-radius: 999px;
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: #FFFFFF;
    font-size: 0.65rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #FFFFFF;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45);
  }
  .slf-bell-popover {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 360px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 18px;
    box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
    z-index: 1050;
    overflow: hidden;
    animation: popover-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .slf-bell-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #F1F5F9;
    cursor: pointer;
    transition: background 0.15s ease;
    text-decoration: none;
    color: inherit;
  }
  .slf-bell-item:hover {
    background: #F8FAFC;
  }
  .slf-bell-item.unread {
    background: #F5F7FF;
  }
  .slf-bell-item.unread:hover {
    background: #EEF2FF;
  }
  .slf-bell-item:last-child {
    border-bottom: none;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('slf-bell-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'slf-bell-styles';
  styleEl.textContent = BELL_CSS;
  document.head.appendChild(styleEl);
}

const NotificationBell = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const prevCountRef = useRef(unreadCount);

  // Détection de nouvelles notifications pour faire tinter la cloche
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setRinging(true);
      const timer = setTimeout(() => setRinging(false), 700);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Fermeture du popover au clic extérieur ou touche Échap
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const recentNotifications = notifications.slice(0, 4);

  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton Cloche */}
      <button
        ref={triggerRef}
        type="button"
        className={`slf-bell-trigger${ringing ? ' ringing' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Centre de notifications — ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
        title="Notifications"
      >
        <Bell size={18} className="bell-svg" />
        {unreadCount > 0 && (
          <span className="slf-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Élégant */}
      {open && (
        <div className="slf-bell-popover" ref={popoverRef}>
          {/* Header dégradé subtil avec statut Live */}
          <div
            style={{
              padding: '0.85rem 1.1rem',
              background: 'linear-gradient(135deg, #FAFAFE 0%, #EEF2FF 100%)',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <Sparkles size={14} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  Notifications
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                  <span
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#10B981', display: 'inline-block',
                      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>
                    En direct (5s)
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton rapide "Tout marquer lu" si non lues */}
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={() => {
                  onMarkAllRead();
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  background: '#FFFFFF', border: '1px solid #C7D2FE',
                  borderRadius: 8, padding: '0.25rem 0.6rem',
                  fontSize: '0.72rem', fontWeight: 700, color: '#4F46E5',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(99, 102, 241, 0.1)',
                }}
                title="Tout marquer comme lu"
              >
                <CheckCheck size={13} />
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          {/* Liste des notifications récentes */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {recentNotifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                <Inbox size={38} strokeWidth={1.2} style={{ margin: '0 auto 0.6rem', opacity: 0.7 }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569' }}>
                  Aucune notification
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                  Les correspondances détectées apparaîtront ici.
                </div>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const score = notif.score ?? notif.matchScore;
                const scoreMeta = getScoreMeta(score);

                return (
                  <div
                    key={notif.id}
                    className={`slf-bell-item${!notif.read ? ' unread' : ''}`}
                    onClick={() => {
                      if (!notif.read && onMarkRead) onMarkRead(notif.id);
                      setOpen(false);
                    }}
                  >
                    {/* Mini jauge circulaire */}
                    <MiniCircleGauge score={score} />

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        {!notif.read && (
                          <span
                            style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: '#3B82F6', flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem', fontWeight: 800,
                            color: scoreMeta.color,
                            background: scoreMeta.bg,
                            padding: '0.08rem 0.4rem', borderRadius: 999,
                          }}
                        >
                          Match {score != null ? `${score.toFixed(1)}%` : 'Détecté'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} />
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8rem',
                          color: notif.read ? '#475569' : '#0F172A',
                          fontWeight: notif.read ? 400 : 600,
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Bouton rapide marquer lu */}
                    {!notif.read && onMarkRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(notif.id);
                        }}
                        style={{
                          background: 'none', border: 'none',
                          color: '#94A3B8', padding: 4, borderRadius: 6,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          flexShrink: 0, alignSelf: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#059669';
                          e.currentTarget.style.background = '#ECFDF5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#94A3B8';
                          e.currentTarget.style.background = 'none';
                        }}
                        title="Marquer comme lu"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer avec lien vers la page complète */}
          <div
            style={{
              padding: '0.65rem 1rem',
              background: '#FAFAFE',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
            }}
          >
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5',
                textDecoration: 'none', padding: '0.35rem 0.75rem',
                borderRadius: 8, transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF2FF')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>Accéder au Centre de Notifications</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
