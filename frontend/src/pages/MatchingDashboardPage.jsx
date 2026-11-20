import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Package,
  ArrowRight
} from 'lucide-react';
import { getMatchingStats, getAllMatches } from '../services/matchingService.js';
import { ScoreBadge, MatchStatusBadge } from '../components/matching/ScoreBadge.jsx';

const MatchingDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, matchesData] = await Promise.all([
        getMatchingStats(),
        getAllMatches(),
      ]);
      setStats(statsData);
      setRecentMatches((matchesData || []).slice(0, 5));
    } catch (err) {
      setError(err.message || 'Impossible de joindre le service de matching.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4F46E5', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <Sparkles size={16} /> TABLEAU DE BORD
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Activité de Matching
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0.35rem 0 0' }}>
            Indicateurs clés, distribution des statuts et rapprochements récents en temps réel.
          </p>
        </div>

        <button
          onClick={loadData}
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#4F46E5' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chargement des statistiques...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ color: '#991B1B', fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Grille de KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.82rem', fontWeight: 600 }}>
                Total Rapprochements
                <Layers size={16} color="#4F46E5" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.5rem' }}>
                {stats?.totalMatches || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Score moyen : <strong>{stats?.averageScore || 0}%</strong>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.82rem', fontWeight: 600 }}>
                Notifiés aux propriétaires
                <Clock size={16} color="#2563EB" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563EB', marginTop: '0.5rem' }}>
                {stats?.notifiedMatches || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                En attente de confirmation
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.82rem', fontWeight: 600 }}>
                Correspondances Confirmées
                <CheckCircle2 size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '0.5rem' }}>
                {stats?.confirmedMatches || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Objets restitués
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.82rem', fontWeight: 600 }}>
                Base d'Objets Actifs
                <Package size={16} color="#7C3AED" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.5rem' }}>
                {stats?.totalItems || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                {stats?.lostItems || 0} perdus · {stats?.foundItems || 0} trouvés
              </div>
            </div>
          </div>

          {/* Rapprochements Récents */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Dernières Correspondances
              </h2>
              <Link
                to="/matches"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#4F46E5',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                Voir tout ({stats?.totalMatches || 0}) <ArrowRight size={13} />
              </Link>
            </div>

            {recentMatches.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>Aucune correspondance récente.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentMatches.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #F1F5F9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <ScoreBadge score={m.score} size="sm" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        Perdu #{m.lostItemId} ↔ Trouvé #{m.foundItemId}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <MatchStatusBadge status={m.status} />
                      <Link
                        to={`/matches/${m.lostItemId}/${m.foundItemId}?matchId=${m.id}`}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#4F46E5',
                          textDecoration: 'none',
                        }}
                      >
                        Détails →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MatchingDashboardPage;
