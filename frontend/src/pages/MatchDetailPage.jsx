import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Tag,
  Palette,
  FileText,
  User,
  ShieldAlert,
  Award,
  RefreshCw
} from 'lucide-react';
import { getMatchDetails, getMatchesByItem, updateMatchStatus } from '../services/matchingService.js';
import { ScoreBadge, MatchStatusBadge } from '../components/matching/ScoreBadge.jsx';

const MatchDetailPage = () => {
  const { lostItemId, foundItemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchIdParam = searchParams.get('matchId');

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (matchIdParam) {
        const data = await getMatchDetails(Number(matchIdParam));
        setDetails(data);
      } else if (lostItemId) {
        // Fallback: search matches by lost item id
        const matches = await getMatchesByItem(Number(lostItemId));
        const matched = matches.find(m => String(m.foundItemId) === String(foundItemId));
        if (matched) {
          const data = await getMatchDetails(matched.id);
          setDetails(data);
        } else {
          setError('Aucun enregistrement de match trouvé pour cette paire.');
        }
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger les détails du match.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lostItemId, foundItemId, matchIdParam]);

  const handleStatusChange = async (newStatus) => {
    if (!details?.match?.id) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateMatchStatus(details.match.id, newStatus);
      setDetails(prev => ({
        ...prev,
        match: { ...prev.match, status: updated.status }
      }));
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderItemCard = (item, type, titleBg, titleColor) => {
    if (!item) {
      return (
        <div style={{ flex: 1, padding: '1.5rem', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
          Objet #{type === 'LOST' ? lostItemId : foundItemId} non synchronisé dans la base matching.
        </div>
      );
    }

    return (
      <div
        style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ background: titleBg, padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: titleColor, textTransform: 'uppercase' }}>
              {type === 'LOST' ? 'Objet Déclaré Perdu' : 'Objet Déclaré Trouvé'}
            </span>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: titleColor }}>
            #{item.id}
          </span>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem' }}>
            <User size={14} /> Déclaré par l'utilisateur : <strong style={{ color: '#0F172A' }}>#{item.userId}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem' }}>
            <Tag size={14} /> Catégorie : <strong style={{ color: '#0F172A' }}>{item.category || 'Non spécifiée'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem' }}>
            <Palette size={14} /> Couleur : <strong style={{ color: '#0F172A' }}>{item.color || 'Inconnu'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem' }}>
            <MapPin size={14} /> Lieu : <strong style={{ color: '#0F172A' }}>{item.location || 'Lieu inconnu'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem' }}>
            <Calendar size={14} /> Date signalée : <strong style={{ color: '#0F172A' }}>{item.date || 'Non daté'}</strong>
          </div>

          {item.description && (
            <div style={{ marginTop: '0.35rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#334155' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Description
              </div>
              {item.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Bouton retour */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Retour
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#4F46E5' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Calcul des critères d'explication...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', textAlign: 'center' }}>
          <ShieldAlert size={28} color="#DC2626" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ color: '#991B1B', fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Bannière de Résumé du Match */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px -4px rgba(49, 46, 129, 0.3)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#A5B4FC', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Sparkles size={14} /> Rapprochement Intelligent
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: '#FFFFFF' }}>
                Correspondance Perdu #{details.lostItem?.id || lostItemId} ↔ Trouvé #{details.foundItem?.id || foundItemId}
              </h1>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <MatchStatusBadge status={details.match?.status} />
                <span style={{ fontSize: '0.8rem', color: '#C7D2FE' }}>
                  Détecté le {details.match?.createdAt ? new Date(details.match.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <ScoreBadge score={details.match?.score} size="lg" />
              <span style={{ fontSize: '0.75rem', color: '#A5B4FC' }}>
                Seuil de confirmation : 70.0%
              </span>
            </div>
          </div>

          {/* Comparaison Côte à Côte */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {renderItemCard(details.lostItem, 'LOST', '#FEF2F2', '#991B1B')}
            {renderItemCard(details.foundItem, 'FOUND', '#F0FDF4', '#166534')}
          </div>

          {/* Explication Détaillée des Critères */}
          {details.explanation && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem' }}>
                Explication des Scores par Critère
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {Object.entries(details.explanation.criteriaScores || {}).map(([key, score]) => {
                  const weight = details.explanation.criteriaWeights?.[key] || 0;
                  const explanation = details.explanation.explanations?.[key] || '';
                  const labelMap = {
                    category: 'Catégorie (30%)',
                    color: 'Couleur (20%)',
                    location: 'Localisation (25%)',
                    date: 'Date d\'événement (15%)',
                    description: 'Description textuelle (10%)',
                  };

                  return (
                    <div key={key} style={{ padding: '0.9rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          {labelMap[key] || key}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: score >= 75 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626' }}>
                          {score}%
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.45rem' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444' }} />
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions d'état du match */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={() => handleStatusChange('CONFIRMED')}
              disabled={updatingStatus || details.match?.status === 'CONFIRMED'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                background: '#059669',
                color: '#FFFFFF',
                borderRadius: '10px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: updatingStatus || details.match?.status === 'CONFIRMED' ? 'not-allowed' : 'pointer',
                opacity: details.match?.status === 'CONFIRMED' ? 0.6 : 1,
              }}
            >
              <CheckCircle2 size={16} /> Confirmer la restitution
            </button>

            <button
              onClick={() => handleStatusChange('REJECTED')}
              disabled={updatingStatus || details.match?.status === 'REJECTED'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                background: '#FEF2F2',
                color: '#DC2626',
                borderRadius: '10px',
                border: '1px solid #FECACA',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: updatingStatus || details.match?.status === 'REJECTED' ? 'not-allowed' : 'pointer',
                opacity: details.match?.status === 'REJECTED' ? 0.6 : 1,
              }}
            >
              <XCircle size={16} /> Marquer non correspondant
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchDetailPage;
