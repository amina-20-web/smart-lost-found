/**
 * ToastNotification.jsx
 *
 * Conteneur de Toasts Bootstrap 5 affiché en bas à droite de l'écran.
 * Chaque toast apparaît lors de la réception d'une nouvelle notification
 * et disparaît automatiquement après 5 secondes.
 *
 * Usage :
 *   const { toasts, addToast } = useToasts();
 *   <ToastContainer toasts={toasts} onDismiss={removeToast} />
 */

import React, { useState, useCallback } from 'react';
import { getScoreBadgeColor } from '../services/notificationService';

// ─────────────────────────────────────────────────────────────────
//  Hook useToasts — gestion de la liste des toasts actifs
// ─────────────────────────────────────────────────────────────────

/**
 * @returns {{ toasts: Array, addToast: Function, removeToast: Function }}
 */
export const useToasts = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((notification) => {
    const id = Date.now(); // ID unique basé sur le timestamp
    setToasts((prev) => [...prev, { id, notification }]);

    // Auto-suppression après 5 secondes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// ─────────────────────────────────────────────────────────────────
//  Composant ToastContainer
// ─────────────────────────────────────────────────────────────────

/**
 * @param {{ toasts: Array, onDismiss: Function }} props
 */
const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="toast-container position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1100 }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(({ id, notification }) => {
        const badgeColor = getScoreBadgeColor(notification.score);
        return (
          <div
            key={id}
            className="toast show align-items-center border-0 shadow"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body d-flex align-items-start gap-2">
                {/* Icône cloche */}
                <i
                  className="bi bi-bell-fill flex-shrink-0 mt-1"
                  style={{ color: 'var(--bs-primary)', fontSize: '1.1rem' }}
                />
                <div>
                  {/* Badge score */}
                  {notification.score != null && (
                    <span className={`badge bg-${badgeColor} me-1`}>
                      {notification.score.toFixed(1)}%
                    </span>
                  )}
                  {/* Message */}
                  <small className="text-body">{notification.message}</small>
                </div>
              </div>
              {/* Bouton fermeture */}
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Fermer"
                onClick={() => onDismiss(id)}
              />
            </div>
            {/* Barre de progression Bootstrap pour le countdown visuel */}
            <div
              className="progress rounded-0"
              style={{ height: '3px' }}
              aria-hidden="true"
            >
              <div
                className={`progress-bar bg-${badgeColor}`}
                role="progressbar"
                style={{
                  width: '100%',
                  animation: 'shrink 5s linear forwards',
                }}
              />
            </div>
          </div>
        );
      })}
      {/* Animation CSS pour la barre de progression */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
