/**
 * CreateItemPage.jsx — Smart Lost & Found
 * Formulaire de déclaration d'un objet perdu (LOST) ou trouvé (FOUND).
 * À la soumission, l'objet est enregistré dans MySQL via Item Service (port 8000)
 * et un événement ItemCreated est publié sur CloudAMQP !
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package, Plus, ArrowLeft, CheckCircle2, AlertCircle,
  Tag, MapPin, Calendar, Palette, FileText, Send, Sparkles
} from 'lucide-react';

import { createItem } from '../services/itemService';

const CATEGORIES = [
  { value: 'BAG', label: '🎒 Sac & Bagagerie' },
  { value: 'ELECTRONICS', label: '💻 Électronique (Téléphone, PC, Écouteurs)' },
  { value: 'KEYS', label: '🔑 Clés' },
  { value: 'CLOTHING', label: '👕 Vêtement & Accessoire' },
  { value: 'DOCUMENTS', label: '📄 Documents & Cartes' },
  { value: 'JEWELRY', label: '💍 Bijoux & Montres' },
  { value: 'OTHER', label: '📦 Autre objet' },
];

const COMMON_COLORS = [
  'NOIR', 'BLANC', 'BLEU', 'ROUGE', 'GRIS',
  'VERT', 'JAUNE', 'MARRON', 'ARGENTÉ', 'DORÉ'
];

const CreateItemPage = ({ userId }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user_id: userId || 1,
    type: 'LOST',
    title: '',
    category: 'BAG',
    color: 'NOIR',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [submitting, setSubmitting] = useState(false);
  const [successItem, setSuccessItem] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        user_id: Number(userId || formData.user_id),
      };

      const created = await createItem(payload);
      setSuccessItem(created);
    } catch (err) {
      const pydanticError = err.response?.data?.detail;
      if (Array.isArray(pydanticError) && pydanticError.length > 0) {
        const firstErr = pydanticError[0];
        const fieldName = firstErr.loc?.slice(-1)[0] || 'Champ';
        const labels = {
          title: 'Titre',
          category: 'Catégorie',
          color: 'Couleur',
          location: 'Lieu',
          description: 'Description',
          date: 'Date',
          type: 'Type',
        };
        const friendlyField = labels[fieldName] || fieldName;
        setError(`Le champ « ${friendlyField} » doit contenir au moins 2 caractères (${firstErr.msg}).`);
      } else if (typeof pydanticError === 'string') {
        setError(pydanticError);
      } else {
        setError(err.message || 'Erreur lors de la déclaration de l’objet.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      
      {/* ── Bouton Retour ── */}
      <Link
        to="/items"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#64748B',
          textDecoration: 'none',
          fontSize: '0.88rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={16} /> Retour au catalogue des objets
      </Link>

      {/* ── Succès : Affichage de la confirmation ── */}
      {successItem ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
            Déclaration enregistrée avec succès !
          </h2>
          
          <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            L'objet <strong>« {successItem.title} »</strong> a été enregistré sous l'identifiant <strong>#{successItem.id}</strong> dans MySQL.
          </p>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', maxWidth: '450px', margin: '0 auto 2rem', textAlign: 'left', fontSize: '0.84rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#4F46E5', fontWeight: 700, marginBottom: '0.35rem' }}>
              <Sparkles size={16} /> Événement RabbitMQ publié
            </div>
            <div>Exchange : <code>smartlostfound.exchange</code></div>
            <div>Routing Key : <code>item.created</code></div>
            <div style={{ marginTop: '0.35rem', color: '#64748B' }}>
              Le <strong>Matching Service</strong> va analyser cet objet pour trouver une correspondance !
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSuccessItem(null);
                setFormData({
                  user_id: userId || 1,
                  type: 'LOST',
                  title: '',
                  category: 'BAG',
                  color: 'NOIR',
                  location: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                });
              }}
              style={{
                padding: '0.7rem 1.3rem',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Déclarer un autre objet
            </button>

            <Link
              to="/items"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.7rem 1.4rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.88rem',
              }}
            >
              Voir la liste des objets →
            </Link>
          </div>
        </div>
      ) : (
        /* ── Formulaire de déclaration ── */
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '2.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Déclarer un Objet
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Remplissez les détails ci-dessous pour lancer la détection automatique de correspondances.
            </p>
          </div>

          {error && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '0.85rem 1rem', color: '#9F1239', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Type : LOST ou FOUND */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Que souhaitez-vous déclarer ?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'LOST' }))}
                  style={{
                    padding: '0.9rem',
                    borderRadius: '12px',
                    border: formData.type === 'LOST' ? '2px solid #E11D48' : '1px solid #CBD5E1',
                    background: formData.type === 'LOST' ? '#FFF1F2' : '#FFFFFF',
                    color: formData.type === 'LOST' ? '#BE123C' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  🔴 J'ai perdu un objet (LOST)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'FOUND' }))}
                  style={{
                    padding: '0.9rem',
                    borderRadius: '12px',
                    border: formData.type === 'FOUND' ? '2px solid #059669' : '1px solid #CBD5E1',
                    background: formData.type === 'FOUND' ? '#ECFDF5' : '#FFFFFF',
                    color: formData.type === 'FOUND' ? '#047857' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  🟢 J'ai trouvé un objet (FOUND)
                </button>
              </div>
            </div>

            {/* Titre */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Titre de l'objet *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ex : Sac à dos noir, Clés de voiture avec badge..."
                value={formData.title}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Catégorie & Couleur */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Catégorie *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Couleur principale *
                </label>
                <input
                  type="text"
                  name="color"
                  required
                  placeholder="Ex : NOIR, BLEU MARINE..."
                  value={formData.color}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Lieu & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Lieu (perte ou découverte) *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="Ex : Bibliothèque, Cafétéria, Salle A2..."
                  value={formData.location}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Date de l'événement *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Description détaillée */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Description détaillée *
              </label>
              <textarea
                name="description"
                rows="4"
                required
                placeholder="Décrivez les signes particuliers (marques, rayures, contenu du sac, porte-clés...)"
                value={formData.description}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Encart Informative sur l'Architecture Distribuée */}
            <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569', marginBottom: '1.75rem' }}>
              💡 <strong>Action distribuée :</strong> Cette déclaration sera associée à votre compte <strong>Utilisateur #{userId}</strong>.
              Dès la validation, l'événement sera publié sur <strong>CloudAMQP</strong> pour comparaison immédiate.
            </div>

            {/* Bouton de Soumission */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {submitting ? 'Enregistrement en cours...' : (
                <>
                  <Send size={18} /> Enregistrer la déclaration et publier l'événement
                </>
              )}
            </button>

          </form>
        </div>
      )}

    </div>
  );
};

export default CreateItemPage;
