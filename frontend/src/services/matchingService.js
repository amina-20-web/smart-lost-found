/**
 * matchingService.js
 * Service d'interaction avec le microservice Matching Service (Spring Boot).
 * Supporte le port direct du Matching Service (8082) ou l'API Gateway si configuré.
 */

import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_MATCHING_API_URL || 'http://localhost:8082/api/matching').trim();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[matchingService] Erreur API :', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Récupère tous les matches enregistrés.
 */
export const getAllMatches = async () => {
  const { data } = await api.get('/matches');
  return data;
};

/**
 * Récupère les matches associés aux objets d'un utilisateur spécifique.
 * @param {number} userId
 */
export const getUserMatches = async (userId) => {
  const { data } = await api.get(`/matches/user/${userId}`);
  return data;
};

/**
 * Récupère un match par son identifiant.
 * @param {number} matchId
 */
export const getMatchById = async (matchId) => {
  const { data } = await api.get(`/matches/${matchId}`);
  return data;
};

/**
 * Récupère les détails complets d'un match (items associés + explications de similarité).
 * @param {number} matchId
 */
export const getMatchDetails = async (matchId) => {
  const { data } = await api.get(`/matches/${matchId}/details`);
  return data;
};

/**
 * Récupère les matches associés à un objet donné.
 * @param {number} itemId
 */
export const getMatchesByItem = async (itemId) => {
  const { data } = await api.get(`/matches/item/${itemId}`);
  return data;
};

/**
 * Récupère les statistiques globales de matching.
 */
export const getMatchingStats = async () => {
  const { data } = await api.get('/matches/stats');
  return data;
};

/**
 * Met à jour le statut d'un match (ex: CONFIRMED, REJECTED).
 * @param {number} matchId
 * @param {string} status
 */
export const updateMatchStatus = async (matchId, status) => {
  const { data } = await api.patch(`/matches/${matchId}/status`, { status });
  return data;
};

/**
 * Évalue à la volée la compatibilité de deux objets sans persistance.
 * @param {Object} item1
 * @param {Object} item2
 */
export const evaluateMatch = async (item1, item2) => {
  const { data } = await api.post('/evaluate', { item1, item2 });
  return data;
};
