/**
 * App.jsx
 *
 * Composant racine de l'application Smart Lost & Found.
 * Fournit :
 *  - La Navbar avec NotificationBell intégrée
 *  - Les routes React Router
 *  - Le polling global des notifications (partagé entre Navbar et pages)
 *  - Le système de Toasts
 */

import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useParams } from 'react-router-dom';

import NotificationBell  from './components/NotificationBell.jsx';
import ToastContainer, { useToasts } from './components/ToastNotification.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

import {
  markAsRead,
  getUserNotifications,
  useNotificationPolling,
} from './services/notificationService.js';

const CURRENT_USER_ID = 1;

// ─────────────────────────────────────────────────────────────────
//  Composant Navbar
// ─────────────────────────────────────────────────────────────────

const Navbar = ({ notifications, unreadCount, onMarkRead }) => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
    <div className="container">
      {/* Logo / Titre */}
      <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
        <i className="bi bi-search-heart" style={{ fontSize: '1.4rem' }} />
        Smart Lost &amp; Found
      </Link>

      {/* Bouton hamburger mobile */}
      <button
        className="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Basculer la navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      {/* Liens de navigation */}
      <div className="collapse navbar-collapse" id="mainNavbar">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold' : ''}`}
              to="/"
              end
            >
              <i className="bi bi-house me-1" />
              Accueil
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold' : ''}`}
              to="/notifications"
            >
              <i className="bi bi-bell me-1" />
              Notifications
            </NavLink>
          </li>
        </ul>

        {/* Zone droite de la Navbar : cloche + utilisateur */}
        <div className="d-flex align-items-center gap-3">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={onMarkRead}
          />
          <div
            className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center fw-bold"
            style={{ width: '34px', height: '34px', fontSize: '0.85rem', cursor: 'pointer' }}
            title={`Utilisateur #${CURRENT_USER_ID}`}
          >
            {CURRENT_USER_ID}
          </div>
        </div>
      </div>
    </div>
  </nav>
);

// ─────────────────────────────────────────────────────────────────
//  Pages annexes
// ─────────────────────────────────────────────────────────────────

const HomePage = () => (
  <div className="container py-5 text-center">
    <i className="bi bi-search-heart text-primary d-block mb-3" style={{ fontSize: '5rem' }} />
    <h1 className="display-5 fw-bold">Smart Lost &amp; Found</h1>
    <p className="lead text-muted">
      Système intelligent de gestion d'objets perdus et trouvés.
    </p>
    <Link to="/notifications" className="btn btn-primary btn-lg mt-3">
      <i className="bi bi-bell me-2" />
      Accéder aux notifications
    </Link>
  </div>
);

const MatchDetailPage = () => {
  const { lostItemId, foundItemId } = useParams();
  return (
    <div className="container py-5">
      <div className="alert alert-info shadow-sm">
        <i className="bi bi-info-circle me-2" />
        <strong>Détail du match</strong> — Objet perdu #{lostItemId} ↔ Objet trouvé #{foundItemId}
        <p className="mt-2 mb-0 small text-muted">
          Cette vue sera reliée au microservice de matching.
        </p>
      </div>
      <Link to="/notifications" className="btn btn-outline-secondary">
        <i className="bi bi-arrow-left me-1" />
        Retour aux notifications
      </Link>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  Composant App principal
// ─────────────────────────────────────────────────────────────────

const App = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const { toasts, addToast, removeToast } = useToasts();

  const handleNotificationsUpdate = useCallback((data) => {
    setNotifications(data);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setLoading(false);
    setError(err.message || 'Impossible de contacter le serveur.');
  }, []);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications(CURRENT_USER_ID);
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling global centralisé (5s)
  useNotificationPolling(
    CURRENT_USER_ID,
    handleNotificationsUpdate,
    addToast,
    5000,
    handleError
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = useCallback(async (id) => {
    try {
      const updated = await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: updated.read } : n))
      );
    } catch {
      console.error('Impossible de marquer la notification comme lue.');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100 bg-body-secondary">
        <Navbar
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
        />

        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/notifications"
              element={
                <NotificationsPage
                  notifications={notifications}
                  setNotifications={setNotifications}
                  loading={loading}
                  error={error}
                  onRefresh={refreshNotifications}
                />
              }
            />
            <Route path="/matches/:lostItemId/:foundItemId" element={<MatchDetailPage />} />
            <Route
              path="*"
              element={
                <div className="container py-5 text-center">
                  <i className="bi bi-emoji-frown d-block mb-3 text-muted" style={{ fontSize: '4rem' }} />
                  <h2 className="text-muted">Page introuvable (404)</h2>
                  <Link to="/" className="btn btn-primary mt-3">Retour à l'accueil</Link>
                </div>
              }
            />
          </Routes>
        </main>

        <footer className="bg-dark text-white-50 text-center py-3 small">
          Smart Lost &amp; Found © 2026 — Microservices Edition
        </footer>

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    </BrowserRouter>
  );
};

export default App;
