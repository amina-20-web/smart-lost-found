import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Calendar,
  MapPin,
  Tag,
  AlertCircle
} from 'lucide-react';
import { getAllMatches, getUserMatches } from '../services/matchingService.js';
import { ScoreBadge, MatchStatusBadge } from '../components/matching/ScoreBadge.jsx';

const MatchesPage = ({ userId = 1 }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'my'
  const [minScore, setMinScore] = useState(70);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (filterMode === 'my' && userId) {
        data = await getUserMatches(userId);
      } else {
        data = await getAllMatches();
      }
      setMatches(data || []);
    } catch (err) {
      setError(err.message || 'Impossible de charger les correspondances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [filterMode, userId]);

  const filteredMatches = matches.filter((m) => {
    if (m.score < minScore) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = String(m.id || '');
      const lostId = String(m.lostItemId || '');
      const foundId = String(m.foundItemId || '');
      return matchId.includes(q) || lostId.includes(q) || foundId.includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4F46E5', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <Sparkles size={16} /> SERVICE DE CORRESPONDANCE
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Correspondances Détectées
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0.35rem 0 0' }}>
            Consultez les rapprochements automatiques calculés entre les objets perdus et trouvés.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={loadMatches}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* Barre de Filtres */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mode Tous vs Mes Objets */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '10px' }}>
            <button
              onClick={() => setFilterMode('all')}
              style={{
                padding: '0.4rem 0.9rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filterMode === 'all' ? '#FFFFFF' : 'transparent',
                color: filterMode === 'all' ? '#0F172A' : '#64748B',
                boxShadow: filterMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Tous les rapprochements
            </button>
            <button
              onClick={() => setFilterMode('my')}
              style={{
                padding: '0.4rem 0.9rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filterMode === 'my' ? '#FFFFFF' : 'transparent',
                color: filterMode === 'my' ? '#0F172A' : '#64748B',
                boxShadow: filterMode === 'my' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Mes objets (Utilisateur #{userId})
            </button>
          </div>

          {/* Recherche ID */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', minWidth: '220px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem' }} />
            <input
              type="text"
              placeholder="Chercher ID objet ou match..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Filtres secondaires */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
            <SlidersHorizontal size={14} color="#64748B" />
            <span>Score minimal : <strong>{minScore}%</strong></span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ marginLeft: '0.5rem', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
            <Filter size={14} color="#64748B" />
            <span>Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                background: '#FFFFFF',
              }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PROPOSED">PROPOSED</option>
              <option value="NOTIFIED">NOTIFIED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#4F46E5' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Calcul et chargement des correspondances...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', textAlign: 'center' }}>
          <AlertCircle size={28} color="#DC2626" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ color: '#991B1B', fontWeight: 600, margin: 0 }}>{error}</p>
          <button
            onClick={loadMatches}
            style={{
              marginTop: '1rem',
              padding: '0.45rem 1rem',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '16px' }}>
          <Layers size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: 0 }}>
            Aucune correspondance trouvée
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.35rem 0 0' }}>
            Aucun rapprochement ne correspond aux critères sélectionnés. Essayez d'abaisser le score minimal.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <ScoreBadge score={match.score} size="lg" />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Objet Perdu */}
                  <div style={{ padding: '0.45rem 0.85rem', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>
                      Objet Perdu
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#7F1D1D' }}>
                      Item #{match.lostItemId}
                    </div>
                  </div>

                  <ArrowRight size={16} color="#94A3B8" />

                  {/* Objet Trouvé */}
                  <div style={{ padding: '0.45rem 0.85rem', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                      Objet Trouvé
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532D' }}>
                      Item #{match.foundItemId}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MatchStatusBadge status={match.status} />

                <Link
                  to={`/matches/${match.lostItemId}/${match.foundItemId}?matchId=${match.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.48rem 0.95rem',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  Examiner <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
