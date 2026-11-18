/**
 * itemService.js
 * Service d'interaction avec le microservice Item Service (FastAPI).
 * Gère les opérations CRUD : consultation, création, mise à jour, suppression d'objets.
 */

import axios from 'axios';

// URL directe de l'Item Service (port 8000) ou via l'API Gateway (port 8085)
const BASE_URL = (import.meta.env.VITE_ITEM_API_URL || 'http://localhost:8000/api/items').trim();

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
      console.error('[itemService] Erreur API :', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Récupère la liste des objets avec filtres optionnels.
 * @param {Object} filters { type, status, user_id, skip, limit }
 */
export const getItems = async (filters = {}) => {
  const params = {};
  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.skip !== undefined) params.skip = filters.skip;
  if (filters.limit !== undefined) params.limit = filters.limit;

  const { data } = await api.get('', { params });
  return data;
};

/**
 * Récupère un objet par son identifiant unique.
 * @param {number} id
 */
export const getItemById = async (id) => {
  const { data } = await api.get(`/${id}`);
  return data;
};

/**
 * Déclare un nouvel objet perdu ou trouvé.
 * Déclenche côté backend la publication RabbitMQ de l'événement ItemCreated.
 * @param {Object} itemData
 */
export const createItem = async (itemData) => {
  const { data } = await api.post('', itemData);
  return data;
};

/**
 * Modifie les caractéristiques d'un objet.
 * @param {number} id
 * @param {Object} itemData
 */
export const updateItem = async (id, itemData) => {
  const { data } = await api.put(`/${id}`, itemData);
  return data;
};

/**
 * Modifie uniquement le statut d'un objet (ex: PENDING, MATCHED, CLAIMED).
 * @param {number} id
 * @param {string} status
 */
export const updateItemStatus = async (id, status) => {
  const { data } = await api.patch(`/${id}/status`, { status });
  return data;
};

/**
 * Supprime une déclaration d'objet.
 * @param {number} id
 */
export const deleteItem = async (id) => {
  const { data } = await api.delete(`/${id}`);
  return data;
};

export default {
  getItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
};
