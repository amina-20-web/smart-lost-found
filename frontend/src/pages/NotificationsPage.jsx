/**
 * NotificationsPage.jsx
 *
 * Page "Centre de Notifications" complète avec :
 *  - Filtres par onglets : Toutes / Non lues / Lues
 *  - Cards Bootstrap pour chaque notification avec :
 *      · Message détaillé
 *      · Badge de score coloré (vert / jaune / gris)
 *      · Heure relative
 *      · Bouton "Marquer comme lu"
 *      · Bouton "Supprimer"
 *      · Bouton "Voir le match" → /matches/{lostItemId}/{foundItemId}
 *  - Bouton global "Tout marquer comme lu"
 *  - Gestion des états : Chargement, Erreur de connexion avec bouton réessayer, et Liste vide
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getScoreBadgeColor,
  formatRelativeTime,
  useNotificationPolling,
} from '../services/notificationService';
import ToastContainer, { useToasts } from '../components/ToastNotification';

const CURRENT_USER_ID = 1;

const NotificationsPage = ({
  notifications: sharedNotifications,
  setNotifications: sharedSetNotifications,
  loading: sharedLoading,
  error: sharedError,
  onRefresh,
}) => {
  // État local de repli si le composant est utilisé sans props partagées
  const [localNotifications, setLocalNotifications] = useState([]);
  const [localLoading, setLocalLoading]             = useState(true);
  const [localError, setLocalError]                 = useState(null);

  const notifications    = sharedNotifications !== undefined ? sharedNotifications : localNotifications;
  const setNotifications = sharedSetNotifications !== undefined ? sharedSetNotifications : setLocalNotifications;
  const loading          = sharedLoading !== undefined ? sharedLoading : localLoading;
  const error            = sharedError !== undefined ? sharedError : localError;

  const [activeFilter, setActiveFilter]   = useState('all'); // 'all' | 'unread' | 'read'
  const [actionLoading, setActionLoading] = useState({}); // { [id]: true }
  const [globalLoading, setGlobalLoading] = useState(false);

  const { toasts, addToast, removeToast } = useToasts();

  // Polling autonome uniquement si non géré par App.jsx
  const handleUpdate = useCallback((data) => {
    setLocalNotifications(data);
    setLocalLoading(false);
    setLocalError(null);
  }, []);

  const handleError = useCallback((err) => {
    setLocalLoading(false);
    setLocalError(err.message || 'Impossible de joindre le serveur API Gateway (port 8080).');
  }, []);

  useNotificationPolling(
    sharedNotifications !== undefined ? null : CURRENT_USER_ID,
    handleUpdate,
    addToast,
    5000,
    handleError
  );

  // ─────────────────────────────────────────────────────────────────
  //  Filtrage
  // ─────────────────────────────────────────────────────────────────

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'read')   return  n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─────────────────────────────────────────────────────────────────
  //  Actions
  // ─────────────────────────────────────────────────────────────────

  const handleMarkRead = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: updated.read } : n))
      );
    } catch {
      alert('Erreur lors de la mise à jour de la notification.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous supprimer cette notification ?')) return;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setGlobalLoading(true);
    try {
      await markAllAsRead(CURRENT_USER_ID);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      alert('Erreur lors de la mise à jour globale.');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <>
      <div className="container py-4">
        {/* ── En-tête de la page ── */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
          <div>
            <h1 className="h3 mb-0 fw-bold">
              <i className="bi bi-bell-fill text-primary me-2" />
              Centre de Notifications
            </h1>
            <p className="text-muted small mb-0 mt-1">
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
              {unreadCount > 0 && (
                <span className="ms-2 badge bg-danger rounded-pill">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {/* Bouton global "Tout marquer comme lu" */}
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || globalLoading || loading}
            title={unreadCount === 0 ? 'Toutes les notifications sont déjà lues' : ''}
          >
            {globalLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <i className="bi bi-check2-all" />
            )}
            Tout marquer comme lu
          </button>
        </div>

        {/* ── Alerte d'erreur éventuelle ── */}
        {error && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4" role="alert">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5" />
              <div>
                <strong>Erreur de connexion :</strong> {error}
                <div className="small text-muted mt-1">
                  Vérifiez que <code>api-gateway</code> (port 8080) et <code>notification-service</code> (port 8083) sont bien lancés.
                </div>
              </div>
            </div>
            {onRefresh && (
              <button className="btn btn-sm btn-outline-dark" onClick={onRefresh}>
                <i className="bi bi-arrow-clockwise me-1" />
                Réessayer
              </button>
            )}
          </div>
        )}

        {/* ── Onglets de filtre ── */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          {[
            { key: 'all',    label: 'Toutes',   icon: 'bi-list-ul',       count: notifications.length },
            { key: 'unread', label: 'Non lues', icon: 'bi-envelope',      count: unreadCount },
            { key: 'read',   label: 'Lues',     icon: 'bi-envelope-open', count: Math.max(0, notifications.length - unreadCount) },
          ].map(({ key, label, icon, count }) => (
            <li className="nav-item" role="presentation" key={key}>
              <button
                className={`nav-link d-flex align-items-center gap-2 ${activeFilter === key ? 'active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeFilter === key}
                onClick={() => setActiveFilter(key)}
              >
                <i className={`bi ${icon}`} />
                {label}
                <span className={`badge rounded-pill ${activeFilter === key ? 'bg-primary' : 'bg-secondary'}`}>
                  {count}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* ── Contenu principal ── */}

        {/* État : Chargement initial */}
        {loading && !error && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Chargement des notifications…</span>
            </div>
            <p className="text-muted mt-3">Chargement des notifications…</p>
          </div>
        )}

        {/* État : Aucune notification dans le filtre sélectionné */}
        {!loading && filteredNotifications.length === 0 && (
          <div className="text-center py-5">
            <i
              className={`bi d-block mb-3 text-muted ${
                activeFilter === 'unread' ? 'bi-envelope-check' : 'bi-bell-slash'
              }`}
              style={{ fontSize: '4rem' }}
            />
            <h5 className="text-muted">
              {activeFilter === 'unread'
                ? 'Toutes vos notifications sont lues !'
                : activeFilter === 'read'
                ? 'Aucune notification lue'
                : 'Aucune notification pour le moment'}
            </h5>
            <p className="text-muted small">
              {activeFilter === 'all'
                ? 'Les correspondances détectées par le système apparaîtront ici.'
                : 'Changez de filtre pour voir d\'autres notifications.'}
            </p>
          </div>
        )}

        {/* État : Liste des cartes */}
        {!loading && filteredNotifications.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {filteredNotifications.map((notif) => {
              const badgeColor   = getScoreBadgeColor(notif.score);
              const isLoading    = actionLoading[notif.id];
              const hasMatchLink = notif.lostItemId && notif.foundItemId;

              return (
                <div
                  key={notif.id}
                  className={`card shadow-sm border-0 border-start border-4 border-${badgeColor} ${
                    !notif.read ? 'bg-light' : 'bg-white'
                  }`}
                  style={{ transition: 'background-color 0.3s ease' }}
                >
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">

                      {/* ── Partie gauche : statut + contenu ── */}
                      <div className="d-flex align-items-start gap-3 flex-grow-1">

                        {/* Indicateur non-lu */}
                        <div className="flex-shrink-0 d-flex align-items-center pt-1">
                          {!notif.read ? (
                            <span
                              className={`rounded-circle bg-${badgeColor} d-block`}
                              style={{ width: '10px', height: '10px' }}
                              aria-label="Notification non lue"
                            />
                          ) : (
                            <i className="bi bi-check-circle text-success" style={{ fontSize: '1rem' }} />
                          )}
                        </div>

                        <div className="flex-grow-1">
                          {/* Score badge + statut */}
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            {notif.score != null && (
                              <span className={`badge bg-${badgeColor} fs-6`}>
                                <i className="bi bi-graph-up me-1" />
                                {notif.score.toFixed(1)}% de correspondance
                              </span>
                            )}
                            {!notif.read && (
                              <span className="badge bg-primary">Nouveau</span>
                            )}
                          </div>

                          {/* Message principal */}
                          <p className="mb-2 text-body">{notif.message}</p>

                          {/* Métadonnées */}
                          <div className="d-flex flex-wrap gap-3 text-muted small">
                            <span>
                              <i className="bi bi-clock me-1" />
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                            {notif.lostItemId && (
                              <span>
                                <i className="bi bi-search me-1" />
                                Objet perdu #{notif.lostItemId}
                              </span>
                            )}
                            {notif.foundItemId && (
                              <span>
                                <i className="bi bi-box-seam me-1" />
                                Objet trouvé #{notif.foundItemId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Partie droite : Actions ── */}
                      <div className="d-flex flex-wrap gap-2 flex-shrink-0">

                        {/* Voir le match */}
                        {hasMatchLink && (
                          <Link
                            to={`/matches/${notif.lostItemId}/${notif.foundItemId}`}
                            className="btn btn-sm btn-outline-primary"
                            title="Voir la correspondance détaillée"
                          >
                            <i className="bi bi-eye me-1" />
                            Voir le match
                          </Link>
                        )}

                        {/* Marquer comme lu */}
                        {!notif.read && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleMarkRead(notif.id)}
                            disabled={isLoading}
                            title="Marquer comme lu"
                          >
                            {isLoading ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            ) : (
                              <i className="bi bi-check2" />
                            )}
                            <span className="ms-1 d-none d-sm-inline">Marquer lu</span>
                          </button>
                        )}

                        {/* Supprimer */}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(notif.id)}
                          disabled={isLoading}
                          title="Supprimer cette notification"
                        >
                          {isLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          ) : (
                            <i className="bi bi-trash3" />
                          )}
                          <span className="ms-1 d-none d-sm-inline">Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Toasts en bas à droite ── */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
};

export default NotificationsPage;
