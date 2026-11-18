/**
 * notificationService.js
 *
 * Service centralisé pour toutes les interactions avec l'API de notifications.
 * - Appels HTTP via axios vers l'API Gateway (http://localhost:8080)
 * - Hook de polling automatique toutes les 5 secondes
 * - Callback pour déclencher un Toast lors de nouvelles notifications
 */

import axios from 'axios';

// ─────────────────────────────────────────────────────────────────
//  Configuration Axios
// ─────────────────────────────────────────────────────────────────

//const BASE_URL = 'http://localhost:8085';
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085').trim();

const api = axios.create({
  baseURL: `${BASE_URL}/api/notifications`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000, // 8 secondes max par requête
});

// Intercepteur global : log les erreurs réseau en développement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[notificationService] Erreur API :', error.message);
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────
//  Fonctions de l'API REST
// ─────────────────────────────────────────────────────────────────

/**
 * Récupère toutes les notifications d'un utilisateur (plus récentes en premier).
 * @param {number} userId
 * @returns {Promise<Notification[]>}
 */
export const getUserNotifications = async (userId) => {
  const { data } = await api.get(`/user/${userId}`);
  return data;
};

/**
 * Récupère uniquement les notifications non lues d'un utilisateur.
 * @param {number} userId
 * @returns {Promise<Notification[]>}
 */
export const getUnreadNotifications = async (userId) => {
  const { data } = await api.get(`/user/${userId}/unread`);
  return data;
};

/**
 * Récupère le nombre de notifications non lues (pour le badge).
 * @param {number} userId
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  const { data } = await api.get(`/user/${userId}/unread/count`);
  return data;
};

/**
 * Marque une notification spécifique comme lue.
 * @param {number} notificationId
 * @returns {Promise<Notification>}
 */
export const markAsRead = async (notificationId) => {
  const { data } = await api.put(`/${notificationId}/read`);
  return data;
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues.
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (userId) => {
  await api.put(`/user/${userId}/read-all`);
};

/**
 * Supprime une notification.
 * @param {number} notificationId
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  await api.delete(`/${notificationId}`);
};

// ─────────────────────────────────────────────────────────────────
//  Hook de polling automatique
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook React qui poll les notifications toutes les `interval` millisecondes.
 *
 * @param {number}   userId          - L'ID utilisateur à surveiller
 * @param {Function} onNotifications - Callback(notifications[]) appelé à chaque poll
 * @param {Function} onNewNotif      - Callback(notification) appelé quand une NOUVELLE notif arrive
 * @param {number}   [interval=5000] - Intervalle de polling en ms (défaut : 5 secondes)
 *
 * @example
 * useNotificationPolling(1, setNotifications, (n) => showToast(n), 5000);
 */
export const useNotificationPolling = (
  userId,
  onNotifications,
  onNewNotif,
  interval = 5000,
  onError = null
) => {
  // Stocke les IDs des notifications déjà vues pour détecter les nouvelles
  const knownIdsRef = useRef(new Set());
  const isFirstPoll = useRef(true);

  const poll = useCallback(async () => {
    if (!userId) return;

    try {
      const notifications = await getUserNotifications(userId);
      onNotifications(notifications);

      if (isFirstPoll.current) {
        // Premier poll : initialise la liste des IDs connus sans Toast
        notifications.forEach((n) => knownIdsRef.current.add(n.id));
        isFirstPoll.current = false;
        return;
      }

      // Polls suivants : détecte les nouvelles notifications
      const newNotifs = notifications.filter(
        (n) => !knownIdsRef.current.has(n.id)
      );

      newNotifs.forEach((n) => {
        knownIdsRef.current.add(n.id);
        if (typeof onNewNotif === 'function') {
          onNewNotif(n);
        }
      });
    } catch (err) {
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  }, [userId, onNotifications, onNewNotif, onError]);

  useEffect(() => {
    poll(); // Exécution immédiate
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer); // Nettoyage à l'unmount
  }, [poll, interval]);
};

// ─────────────────────────────────────────────────────────────────
//  Utilitaires
// ─────────────────────────────────────────────────────────────────

/**
 * Retourne la couleur Bootstrap du badge selon le score de correspondance.
 * @param {number|null} score - Score en pourcentage (0–100)
 * @returns {'success'|'warning'|'secondary'} Couleur Bootstrap
 */
export const getScoreBadgeColor = (score) => {
  if (score == null) return 'secondary';
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'secondary';
};

/**
 * Formate une date ISO en temps relatif lisible en français.
 * @param {string} isoDate
 * @returns {string}
 */
export const formatRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);

  if (diff < 60)         return 'à l\'instant';
  if (diff < 3600)       return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)      return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000)    return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(isoDate).toLocaleDateString('fr-FR');
};
