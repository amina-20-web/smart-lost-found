/**
 * NotificationBell.jsx
 *
 * Icône de cloche dans la Navbar avec :
 *  - Badge rouge affichant le nombre exact de notifications non lues
 *  - Dropdown Bootstrap des 5 dernières notifications
 *  - Badge coloré selon le score (vert ≥ 80 %, jaune ≥ 50 %, gris sinon)
 *  - Fond bg-light pour les notifications non lues
 *  - Lien « Voir toutes les notifications »
 *
 * Props :
 *  @param {number}   userId       - ID de l'utilisateur connecté
 *  @param {Array}    notifications - Tableau de notifications (fourni par le parent via polling)
 *  @param {number}   unreadCount  - Nombre de non lues (pour le badge)
 *  @param {Function} onMarkRead   - Callback(id) pour marquer une notification comme lue
 */

import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getScoreBadgeColor, formatRelativeTime } from '../services/notificationService';

const NotificationBell = ({ notifications = [], unreadCount = 0, onMarkRead }) => {
  const dropdownRef = useRef(null);
  const triggerRef  = useRef(null);

  // ── Initialisation du Dropdown Bootstrap via JS (sans react-bootstrap) ──
  useEffect(() => {
    let dropdown = null;
    if (triggerRef.current && window.bootstrap) {
      dropdown = new window.bootstrap.Dropdown(triggerRef.current, {
        autoClose: true,
      });
    }
    return () => {
      if (dropdown) dropdown.dispose();
    };
  }, []);

  // ── 5 dernières notifications pour le dropdown ──
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="dropdown" ref={dropdownRef}>
      {/* ── Bouton déclencheur ── */}
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-link nav-link position-relative text-white p-1"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label={`Notifications — ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
        title="Notifications"
      >
        <i
          className="bi bi-bell-fill"
          style={{ fontSize: '1.4rem' }}
        />
        {/* Badge rouge */}
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem', minWidth: '1.3rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="visually-hidden">notifications non lues</span>
          </span>
        )}
      </button>

      {/* ── Menu déroulant ── */}
      <div
        className="dropdown-menu dropdown-menu-end shadow border-0 p-0"
        style={{ width: '360px', maxHeight: '480px', overflowY: 'auto' }}
      >
        {/* En-tête du dropdown */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-primary text-white rounded-top">
          <span className="fw-semibold">
            <i className="bi bi-bell me-2" />
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="badge bg-white text-primary rounded-pill">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Liste des notifications */}
        {recentNotifications.length === 0 ? (
          <div className="text-center text-muted py-4 px-3">
            <i className="bi bi-bell-slash d-block mb-2" style={{ fontSize: '2rem' }} />
            <small>Aucune notification</small>
          </div>
        ) : (
          <ul className="list-unstyled mb-0">
            {recentNotifications.map((notif) => {
              const badgeColor = getScoreBadgeColor(notif.score);
              return (
                <li
                  key={notif.id}
                  className={`px-3 py-2 border-bottom ${!notif.read ? 'bg-light' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => !notif.read && onMarkRead && onMarkRead(notif.id)}
                >
                  <div className="d-flex align-items-start gap-2">
                    {/* Indicateur non-lu */}
                    <div className="flex-shrink-0 mt-1">
                      {!notif.read ? (
                        <span
                          className="rounded-circle bg-primary d-block"
                          style={{ width: '8px', height: '8px' }}
                          aria-label="Non lu"
                        />
                      ) : (
                        <span style={{ width: '8px', display: 'inline-block' }} />
                      )}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      {/* Badge score */}
                      {notif.score != null && (
                        <span className={`badge bg-${badgeColor} me-1 mb-1`}>
                          {notif.score.toFixed(1)}%
                        </span>
                      )}
                      {/* Message (tronqué à 2 lignes) */}
                      <p
                        className="mb-1 small text-body-secondary"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.4',
                        }}
                      >
                        {notif.message}
                      </p>
                      {/* Heure relative */}
                      <small className="text-muted">
                        <i className="bi bi-clock me-1" />
                        {formatRelativeTime(notif.createdAt)}
                      </small>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pied du dropdown — lien vers la page complète */}
        <div className="p-2 border-top text-center bg-white rounded-bottom">
          <Link
            to="/notifications"
            className="btn btn-sm btn-outline-primary w-100"
            onClick={() => {
              // Ferme le dropdown Bootstrap au clic
              if (triggerRef.current && window.bootstrap) {
                const dd = window.bootstrap.Dropdown.getInstance(triggerRef.current);
                if (dd) dd.hide();
              }
            }}
          >
            <i className="bi bi-list-ul me-1" />
            Voir toutes les notifications
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;
