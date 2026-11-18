/**
 * ToastNotification.jsx — Smart Lost & Found
 * Système de toasts flottants modernes (Glassmorphism & Apple/Linear style)
 * - Apparition fluide en bas à droite
 * - Décompte animé avec barre de progression colorée
 * - Badge de score et message
 * - Rendu responsive
 */

import React, { useState, useCallback } from 'react';
import { Bell, X, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const getScoreColor = (score) => {
  if (score == null) return { color: '#4F46E5', bg: '#EEF2FF', label: 'Nouveau' };
  if (score >= 90)   return { color: '#059669', bg: '#ECFDF5', label: `${score.toFixed(1)}%` };
  if (score >= 75)   return { color: '#D97706', bg: '#FFFBEB', label: `${score.toFixed(1)}%` };
  return               { color: '#2563EB', bg: '#EFF6FF', label: `${score.toFixed(1)}%` };
};

const TOAST_DURATION = 5000; // 5 secondes

// ── Hook personnalisé useToasts ──
export const useToasts = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((notification) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, notification }]);

    // Nettoyage automatique après 5s (+ temps de transition)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION + 300);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// ── Styles CSS injectés pour le Toast ──
const TOAST_CSS = `
  .slf-toast-wrap {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 1200;
    pointer-events: none;
    max-width: calc(100vw - 2rem);
  }
  .slf-toast-card {
    pointer-events: auto;
    width: 360px;
    max-width: 100%;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 16px;
    box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    animation: toast-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .slf-toast-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 42px -6px rgba(15, 23, 42, 0.2);
  }
  .slf-toast-bar {
    height: 3px;
    animation: toast-bar linear forwards;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('slf-toast-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'slf-toast-styles';
  styleEl.textContent = TOAST_CSS;
  document.head.appendChild(styleEl);
}

// ── Composant Toast individuel ──
const ToastItem = ({ id, notification, onDismiss }) => {
  const score = notification.score ?? notification.matchScore;
  const scoreMeta = getScoreColor(score);

  return (
    <div className="slf-toast-card">
      <div style={{ padding: '0.9rem 1rem 0.8rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Icône animée */}
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: scoreMeta.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: scoreMeta.color,
            flexShrink: 0,
            boxShadow: `0 2px 8px ${scoreMeta.color}25`,
          }}
        >
          <Sparkles size={18} />
        </div>

        {/* Corps */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
              Nouvelle correspondance
            </span>
            <span
              style={{
                fontSize: '0.68rem', fontWeight: 800,
                color: scoreMeta.color,
                background: scoreMeta.bg,
                padding: '0.08rem 0.45rem', borderRadius: 999,
              }}
            >
              {scoreMeta.label}
            </span>
          </div>

          <p
            style={{
              margin: '0 0 0.35rem',
              fontSize: '0.8rem',
              color: '#475569',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.message}
          </p>

          <Link
            to="/notifications"
            onClick={() => onDismiss(id)}
            style={{
              fontSize: '0.74rem', fontWeight: 700,
              color: '#4F46E5', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            }}
          >
            <span>Consulter les détails</span>
            <ArrowRight size={11} />
          </Link>
        </div>

        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={() => onDismiss(id)}
          style={{
            background: 'none', border: 'none',
            color: '#94A3B8', cursor: 'pointer',
            padding: 2, borderRadius: 6,
            transition: 'color 0.12s, background 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.background = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.background = 'none';
          }}
          aria-label="Fermer la notification"
        >
          <X size={15} />
        </button>
      </div>

      {/* Barre de progression fluide */}
      <div style={{ height: 3, background: '#F1F5F9' }}>
        <div
          className="slf-toast-bar"
          style={{
            background: scoreMeta.color,
            animationDuration: `${TOAST_DURATION}ms`,
          }}
        />
      </div>
    </div>
  );
};

// ── Conteneur global ──
const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="slf-toast-wrap" aria-live="polite" aria-atomic="true">
      {toasts.map(({ id, notification }) => (
        <ToastItem key={id} id={id} notification={notification} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
