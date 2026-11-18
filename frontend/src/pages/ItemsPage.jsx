/**
 * ItemsPage.jsx — Smart Lost & Found
 * Page principale de consultation et gestion des objets (Item Service).
 * Affiche la liste des objets déclarés avec filtres, recherche et actions rapides.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package, Search, Plus, Filter, MapPin, Calendar,
  Tag, Palette, Clock, CheckCircle2, AlertCircle,
  Trash2, RefreshCw, Layers, ArrowRight, UserCheck
} from 'lucide-react';

import { getItems, updateItemStatus, deleteItem } from '../services/itemService';

const statusConfig = {
  PENDING: { label: 'En attente', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  MATCHED: { label: 'Correspondance trouvée', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  CLAIMED: { label: 'Restitué', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  ARCHIVED: { label: 'Archivé', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
};

const ItemsPage = ({ userId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState(initialType);
  const [activeStatus, setActiveStatus] = useState('');
  const [onlyMyItems, setOnlyMyItems] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Synchronise le filtre avec l'URL param ?type=LOST ou ?type=FOUND
  useEffect(() => {
    const t = searchParams.get('type') || '';
    setActiveType(t);
  }, [searchParams]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (activeType) filters.type = activeType;
      if (activeStatus) filters.status = activeStatus;
      if (onlyMyItems && userId) filters.user_id = userId;

      const data = await getItems(filters);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Impossible de joindre le microservice Item Service (port 8000).');
    } finally {
      setLoading(false);
    }
  }, [activeType, activeStatus, onlyMyItems, userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleTypeChange = (type) => {
    setActiveType(type);
    if (type) {
      setSearchParams({ type });
    } else {
      setSearchParams({});
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    setActionLoading(itemId);
    try {
      const updated = await updateItemStatus(itemId, newStatus);
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut : " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (itemId, itemTitle) => {
    if (!window.confirm(`Confirmez-vous la suppression de l'objet « ${itemTitle} » ?`)) return;
    setActionLoading(itemId);
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      alert("Erreur lors de la suppression : " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrage local en temps réel par mot-clé
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.color?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      
      {/* ── En-tête de page ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#EEF2FF', color: '#4F46E5', padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.65rem' }}>
            <Package size={14} /> Item Service · Microservice Port 8000
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
            Catalogue des Objets Déclarés
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Consultez les déclarations d'objets perdus et trouvés enregistrées dans MySQL.
          </p>
        </div>

        <Link
          to="/create-item"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Plus size={18} /> Déclarer un objet
        </Link>
      </div>

      {/* ── Barre de Filtres et Onglets ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Onglets Type : Tous / Perdus / Trouvés */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '10px' }}>
            <button
              onClick={() => handleTypeChange('')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeType === '' ? '#FFFFFF' : 'transparent',
                color: activeType === '' ? '#0F172A' : '#64748B',
                fontWeight: activeType === '' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeType === '' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Tous ({items.length})
            </button>
            <button
              onClick={() => handleTypeChange('LOST')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeType === 'LOST' ? '#FFFFFF' : 'transparent',
                color: activeType === 'LOST' ? '#E11D48' : '#64748B',
                fontWeight: activeType === 'LOST' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeType === 'LOST' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Perdus (LOST)
            </button>
            <button
              onClick={() => handleTypeChange('FOUND')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeType === 'FOUND' ? '#FFFFFF' : 'transparent',
                color: activeType === 'FOUND' ? '#059669' : '#64748B',
                fontWeight: activeType === 'FOUND' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeType === 'FOUND' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Trouvés (FOUND)
            </button>
          </div>

          {/* Recherche textuelle */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Rechercher par titre, catégorie, couleur, lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filtre par Statut */}
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.86rem',
              color: '#334155',
              background: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente (PENDING)</option>
            <option value="MATCHED">Correspondance trouvée (MATCHED)</option>
            <option value="CLAIMED">Restitué (CLAIMED)</option>
            <option value="ARCHIVED">Archivé (ARCHIVED)</option>
          </select>

          {/* Filtre Mes Déclarations */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyMyItems}
              onChange={(e) => setOnlyMyItems(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#4F46E5', cursor: 'pointer' }}
            />
            Mes déclarations (User #{userId})
          </label>

          <button
            onClick={fetchItems}
            title="Rafraîchir"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Message d'erreur si backend indisponible ── */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '1rem 1.25rem', color: '#9F1239', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1, fontSize: '0.9rem' }}>
            <strong>Erreur de connexion :</strong> {error}
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#BE123C' }}>
              Vérifiez que votre serveur Uvicorn tourne bien sur le port 8000 (`uvicorn app.main:app --reload --port 8000`).
            </div>
          </div>
          <button onClick={fetchItems} style={{ background: '#E11D48', color: '#FFFFFF', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      )}

      {/* ── État Chargement ── */}
      {loading && !error && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600 }}>Chargement des objets depuis PostgreSQL / MySQL...</p>
        </div>
      )}

      {/* ── Aucun objet trouvé (Empty State) ── */}
      {!loading && !error && filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Aucun objet trouvé</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
            Aucune déclaration ne correspond à vos filtres actuels. Déclarez un nouvel objet perdu ou trouvé pour commencer !
          </p>
          <Link
            to="/create-item"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#4F46E5',
              color: '#FFFFFF',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.88rem',
            }}
          >
            <Plus size={16} /> Déclarer un objet maintenant
          </Link>
        </div>
      )}

      {/* ── Grille des Cartes d'Objets ── */}
      {!loading && !error && filteredItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredItems.map((item) => {
            const isLost = item.type === 'LOST';
            const statusInfo = statusConfig[item.status] || statusConfig.PENDING;

            return (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  {/* Badge Type (LOST ou FOUND) & Statut */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        background: isLost ? '#FFE4E6' : '#DCFCE7',
                        color: isLost ? '#E11D48' : '#15803D',
                        border: `1px solid ${isLost ? '#FECDD3' : '#BBF7D0'}`,
                      }}
                    >
                      {isLost ? '🔴 Objet Perdu' : '🟢 Objet Trouvé'}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.border}`,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Titre & ID */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                  
                  <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {item.description}
                  </p>

                  {/* Attributs de l'objet */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem', color: '#64748B', background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Tag size={14} color="#6366F1" />
                      <span>Catégorie : <strong>{item.category}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Palette size={14} color="#6366F1" />
                      <span>Couleur : <strong>{item.color}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} color="#EC4899" />
                      <span>Lieu : <strong>{item.location}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#10B981" />
                      <span>Date : <strong>{item.date}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bas de carte : Métadonnées utilisateur & Actions */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                    Objet #{item.id} · Déclaré par User #{item.user_id}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {/* Changer Statut */}
                    <select
                      value={item.status}
                      disabled={actionLoading === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="PENDING">En attente</option>
                      <option value="MATCHED">Correspondance</option>
                      <option value="CLAIMED">Restitué</option>
                      <option value="ARCHIVED">Archiver</option>
                    </select>

                    {/* Supprimer */}
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={actionLoading === item.id}
                      title="Supprimer cette déclaration"
                      style={{
                        border: 'none',
                        background: '#FFF1F2',
                        color: '#E11D48',
                        padding: '0.4rem 0.55rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ItemsPage;
