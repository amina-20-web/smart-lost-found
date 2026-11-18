/**
 * App.jsx — Smart Lost & Found
 * Architecture UI haut de gamme (Linear / Raycast / Apple style)
 * - Barre de navigation flottante et translucide (Glassmorphism)
 * - Hero Section moderne avec Bento Grid en temps réel sur la page d'accueil
 * - Sélecteur d'utilisateur de démonstration stylisé
 * - Polling global centralisé et intégration du Toast
 * - 100% pur JavaScript + CSS
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  Search, Package, Bell, Home, ChevronDown, Sparkles,
  Cpu, Zap, Shield, ArrowRight, ExternalLink, Activity,
  CheckCircle2, ArrowUpRight, Plus, Layers
} from 'lucide-react';

import NotificationBell from './components/NotificationBell.jsx';
import ToastContainer, { useToasts } from './components/ToastNotification.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ItemsPage from './pages/ItemsPage.jsx';
import CreateItemPage from './pages/CreateItemPage.jsx';

import {
  markAsRead,
  markAllAsRead,
  getUserNotifications,
  useNotificationPolling,
} from './services/notificationService.js';

// ── Styles CSS injectés pour l'Application & la Navbar ──
const APP_CSS = `
  /* ── Navbar Flottante Translucide ── */
  .slf-navbar-glass {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-bottom: 1px solid rgba(226, 232, 240, 0.75);
    padding: 0.65rem 0;
    transition: all 0.2s ease;
  }
  .slf-navbar-glass.scrolled {
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);
    border-bottom-color: rgba(226, 232, 240, 0.95);
  }

  .slf-logo-text {
    font-weight: 800;
    font-size: 1.15rem;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Liens de Navigation avec Indicateur Actif ── */
  .slf-nav-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.85rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748B;
    text-decoration: none;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    position: relative;
  }
  .slf-nav-item:hover {
    color: #0F172A;
    background: rgba(241, 245, 249, 0.8);
  }
  .slf-nav-item.active {
    color: #4F46E5;
    background: #EEF2FF;
  }
  .slf-nav-item.disabled {
    opacity: 0.55;
    cursor: default;
    pointer-events: none;
  }

  .slf-badge-soon {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: #F1F5F9;
    color: #94A3B8;
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }

  .slf-nav-unread-pill {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: #FFFFFF;
    font-size: 0.65rem;
    font-weight: 800;
    border-radius: 999px;
    padding: 0.08rem 0.45rem;
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.35);
  }

  /* ── Sélecteur d'Utilisateur Stylisé ── */
  .slf-user-selector {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    background: #FFFFFF;
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 999px;
    padding: 0.22rem 0.75rem 0.22rem 0.28rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .slf-user-selector:hover {
    border-color: #C7D2FE;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  .slf-user-avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: #FFFFFF;
    font-size: 0.72rem;
    font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .slf-user-selector select {
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    color: #334155;
    cursor: pointer;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  /* ── Hero Section & Bento Grid ── */
  .slf-hero-container {
    max-width: 1180px;
    margin: 0 auto;
    padding: 4.5rem 1.5rem 5rem;
  }
  .slf-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(238, 242, 255, 0.9);
    border: 1px solid #C7D2FE;
    border-radius: 999px;
    padding: 0.4rem 1rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: #4F46E5;
    margin-bottom: 1.75rem;
    animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .slf-badge-pulse-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #4F46E5;
    animation: dot-pulse 1.8s ease-in-out infinite;
  }
  .slf-hero-headline {
    font-size: clamp(2.2rem, 5vw, 3.75rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.04em;
    color: #0F172A;
    margin-bottom: 1.35rem;
    animation: fade-up 0.6s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .slf-hero-gradient-text {
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #2563EB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .slf-hero-subtitle {
    font-size: 1.12rem;
    color: #64748B;
    line-height: 1.65;
    max-width: 580px;
    margin-bottom: 2.5rem;
    animation: fade-up 0.6s 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .slf-hero-buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 4.5rem;
    animation: fade-up 0.6s 0.24s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .slf-cta-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
    color: #FFFFFF;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 0.78rem 1.65rem;
    border-radius: 12px;
    text-decoration: none;
    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 4px 10px -2px rgba(99, 102, 241, 0.25);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .slf-cta-primary:hover {
    color: #FFFFFF;
    transform: translateY(-2px);
    box-shadow: 0 14px 30px -4px rgba(99, 102, 241, 0.5);
  }
  .slf-cta-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    background: #FFFFFF;
    color: #334155;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 0.78rem 1.45rem;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
  }
  .slf-cta-secondary:hover {
    color: #4F46E5;
    border-color: #C7D2FE;
    background: #FAFAFE;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }

  /* ── Bento Grid 3 Colonnes ── */
  .slf-bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    animation: fade-up 0.7s 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @media (max-width: 900px) {
    .slf-bento-grid {
      grid-template-columns: 1fr;
    }
  }
  .slf-bento-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 20px;
    padding: 1.65rem;
    box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
    transition: all 0.22s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }
  .slf-bento-card:hover {
    border-color: #C7D2FE;
    box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }

  /* ── Footer ── */
  .slf-footer-clean {
    background: #0F172A;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    padding: 1.2rem 1.5rem;
    font-size: 0.78rem;
    letter-spacing: 0.02em;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('slf-app-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'slf-app-styles';
  styleEl.textContent = APP_CSS;
  document.head.appendChild(styleEl);
}

const USER_OPTIONS = [
  { id: 1, label: 'Utilisateur #1' },
  { id: 2, label: 'Utilisateur #2' },
];

// ─────────────────────────────────────────────────────────────────
//  Barre de Navigation Flottante & Translucide
// ─────────────────────────────────────────────────────────────────
const Navbar = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  userId,
  onUserChange,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`slf-navbar-glass${isScrolled ? ' scrolled' : ''}`}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        {/* Logo avec dégradé indigo-violet */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Sparkles size={17} color="#FFFFFF" />
          </div>
          <span className="slf-logo-text">Smart Lost & Found</span>
        </Link>

        {/* Liens de navigation centraux */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `slf-nav-item${isActive ? ' active' : ''}`}
          >
            <Home size={15} />
            <span>Accueil</span>
          </NavLink>

          <NavLink
            to="/items?type=LOST"
            className={({ isActive }) => `slf-nav-item${isActive ? ' active' : ''}`}
          >
            <Search size={15} />
            <span>Objets perdus</span>
          </NavLink>

          <NavLink
            to="/items?type=FOUND"
            className={({ isActive }) => `slf-nav-item${isActive ? ' active' : ''}`}
          >
            <Package size={15} />
            <span>Objets trouvés</span>
          </NavLink>

          <NavLink
            to="/items"
            end
            className={({ isActive }) => `slf-nav-item${isActive ? ' active' : ''}`}
          >
            <Layers size={15} />
            <span>Tous les objets</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `slf-nav-item${isActive ? ' active' : ''}`}
          >
            <Bell size={15} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="slf-nav-unread-pill">{unreadCount}</span>
            )}
          </NavLink>
        </div>

        {/* Côté droit : Bouton Déclarer + Cloche + Sélecteur Utilisateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
          {/* Bouton Déclarer un objet */}
          <Link
            to="/create-item"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              padding: '0.38rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Plus size={14} /> Déclarer
          </Link>

          {/* Popover Cloche */}
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
          />

          {/* Sélecteur Utilisateur Stylisé */}
          <div className="slf-user-selector" title="Changer d'utilisateur pour la démo">
            <div className="slf-user-avatar">{userId}</div>
            <select
              value={userId}
              onChange={(e) => onUserChange(Number(e.target.value))}
            >
              {USER_OPTIONS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color="#94A3B8" />
          </div>
        </div>
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────────────────────────
//  Page d'Accueil : Hero Section + Aperçu Live (Bento Grid)
// ─────────────────────────────────────────────────────────────────
const HomePage = ({ notifications = [], unreadCount = 0 }) => {
  return (
    <div className="slf-hero-container">
      {/* Badge animé */}
      <div className="slf-hero-badge">
        <span className="slf-badge-pulse-dot" />
        <span>Propulsé par IA & Architecture Microservices</span>
      </div>

      {/* Titre Impactant */}
      <h1 className="slf-hero-headline">
        Retrouvez vos objets perdus grâce au{' '}
        <span className="slf-hero-gradient-text">matching intelligent.</span>
      </h1>

      {/* Sous-titre doux */}
      <p className="slf-hero-subtitle">
        Une plateforme événementielle asynchrone qui connecte instantanément les déclarations
        d’objets perdus et trouvés grâce à l'analyse sémantique et la distribution temps réel RabbitMQ.
      </p>

      {/* Double Bouton d'action CTA */}
      <div className="slf-hero-buttons">
        <Link to="/notifications" className="slf-cta-primary">
          <Bell size={17} />
          <span>Accéder aux notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 999, padding: '0.1rem 0.5rem',
                fontSize: '0.75rem', fontWeight: 800,
              }}
            >
              {unreadCount}
            </span>
          )}
          <ArrowRight size={16} />
        </Link>

        <Link to="/create-item" className="slf-cta-secondary">
          <Plus size={16} />
          <span>Déclarer un objet</span>
        </Link>
      </div>

      {/* Bento Grid 3 Colonnes : Aperçu du système en temps réel */}
      <div className="slf-bento-grid">
        {/* Carte 1 : Détection IA */}
        <div className="slf-bento-card">
          <div>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#EEF2FF', color: '#4F46E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Cpu size={22} />
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Intelligence Artificielle
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0 0.5rem' }}>
              Détection Sémantique
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5 }}>
              Calcul vectoriel et attribution d'un score de similarité (0 à 100%) entre descriptions, lieux et catégories.
            </p>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: 12, padding: '0.75rem 0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
              <span>Exemple de correspondance</span>
              <strong style={{ color: '#059669' }}>92.5% Confiance</strong>
            </div>
            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: '0.45rem' }}>
              <div
                style={{
                  height: '100%', width: '92.5%',
                  background: 'linear-gradient(90deg, #10B981, #059669)',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>

        {/* Carte 2 : Notifications Temps Réel */}
        <div className="slf-bento-card">
          <div>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#FEF2F2', color: '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Bell size={22} />
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Événements Asynchrones
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0 0.5rem' }}>
              Notifications Temps Réel
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5 }}>
              Diffusion automatique des alertes vers votre interface avec rafraîchissement continu et toasts interactifs.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1.25rem', padding: '0.75rem 0.9rem', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                {notifications.length}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>
                Reçues
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: '#E2E8F0' }} />
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>
                {unreadCount}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>
                Non lues
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/notifications" style={{ color: '#4F46E5', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                <span>Voir</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Carte 3 : Architecture Microservices */}
        <div className="slf-bento-card">
          <div>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#ECFDF5', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Activity size={22} />
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Infrastructure
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0.35rem 0 0.5rem' }}>
              Architecture Microservices
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5 }}>
              Système résilient distribué : Spring Cloud Gateway, RabbitMQ CloudAMQP, MySQL et conteneurs Docker.
            </p>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#ECFDF5', border: '1px solid #A7F3D0',
                borderRadius: 999, padding: '0.3rem 0.75rem',
                fontSize: '0.75rem', fontWeight: 700, color: '#047857',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>Système opérationnel • RabbitMQ & Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  Page de Détail du Match (Route : /matches/:lostItemId/:foundItemId)
// ─────────────────────────────────────────────────────────────────
const MatchDetailPage = () => {
  const { lostItemId, foundItemId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.1)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            padding: '1.75rem 2rem',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <Zap size={22} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
              Détail de la Correspondance
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
            Analyse détaillée de l'événement de matching détecté
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 14, padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>
                Objet Perdu
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E40AF', marginTop: 2 }}>
                #{lostItemId}
              </div>
            </div>

            <div style={{ color: '#94A3B8', fontSize: '1.2rem', fontWeight: 800 }}>↔</div>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14, padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                Objet Trouvé
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#065F46', marginTop: 2 }}>
                #{foundItemId}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Cette fiche technique est prête pour la liaison avec les microservices <code>item-service</code>{' '}
            et <code>matching-service</code> de l'application.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="slf-action-btn primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              ← Retour au Centre de Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  Composant Racine App
// ─────────────────────────────────────────────────────────────────
const App = () => {
  const [userId, setUserId] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toasts, addToast, removeToast } = useToasts();

  // Mise à jour continue via polling (toutes les 5 secondes)
  const handleNotificationsUpdate = useCallback((data) => {
    setNotifications(data);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setLoading(false);
    setError(err.message || 'Impossible de joindre le serveur.');
  }, []);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications(userId);
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useNotificationPolling(userId, handleNotificationsUpdate, addToast, 5000, handleError);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = useCallback(async (id) => {
    try {
      const updated = await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: updated.read ?? true } : n))
      );
    } catch {
      /* silent */
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* silent */
    }
  }, [userId]);

  const handleUserChange = useCallback((newId) => {
    setUserId(newId);
    setNotifications([]);
    setLoading(true);
    setError(null);
  }, []);

  return (
    <BrowserRouter>
      {/* Barre de navigation moderne */}
      <Navbar
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        userId={userId}
        onUserChange={handleUserChange}
      />

      {/* Routes de l'application */}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={<HomePage notifications={notifications} unreadCount={unreadCount} />}
          />
          <Route
            path="/items"
            element={<ItemsPage userId={userId} />}
          />
          <Route
            path="/create-item"
            element={<CreateItemPage userId={userId} />}
          />
          <Route
            path="/notifications"
            element={
              <NotificationsPage
                notifications={notifications}
                setNotifications={setNotifications}
                loading={loading}
                error={error}
                onRefresh={refreshNotifications}
                userId={userId}
              />
            }
          />
          <Route
            path="/matches/:lostItemId/:foundItemId"
            element={<MatchDetailPage />}
          />
          <Route
            path="*"
            element={
              <div style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                  Page introuvable (404)
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                  L'adresse demandée n'existe pas ou a été déplacée.
                </p>
                <Link
                  to="/"
                  className="slf-cta-primary"
                  style={{ display: 'inline-flex', marginTop: '1.25rem' }}
                >
                  Retour à l'accueil
                </Link>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Footer épuré */}
      <footer className="slf-footer-clean">
        Smart Lost &amp; Found © 2026 — Architecture Microservices · Spring Cloud Gateway · RabbitMQ · React
      </footer>

      {/* Système de Toasts Flottants */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </BrowserRouter>
  );
};

export default App;
