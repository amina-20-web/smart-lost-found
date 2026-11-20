import React from 'react';
import { Award, CheckCircle2, Clock, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';

export const ScoreBadge = ({ score, size = 'md' }) => {
  const numScore = Number(score) || 0;
  let bg = '#EEF2FF';
  let color = '#4F46E5';
  let border = '#C7D2FE';

  if (numScore >= 90) {
    bg = '#ECFDF5';
    color = '#059669';
    border = '#A7F3D0';
  } else if (numScore >= 75) {
    bg = '#F0FDF4';
    color = '#16A34A';
    border = '#BBF7D0';
  } else if (numScore >= 60) {
    bg = '#FFFBEB';
    color = '#D97706';
    border = '#FDE68A';
  } else {
    bg = '#FEF2F2';
    color = '#DC2626';
    border = '#FECACA';
  }

  const padding = size === 'sm' ? '0.15rem 0.45rem' : size === 'lg' ? '0.4rem 0.9rem' : '0.25rem 0.65rem';
  const fontSize = size === 'sm' ? '0.72rem' : size === 'lg' ? '1rem' : '0.82rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: '999px',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        lineHeight: 1,
      }}
    >
      <Award size={size === 'sm' ? 12 : 14} />
      {numScore.toFixed(1)}%
    </span>
  );
};

export const MatchStatusBadge = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '999px',
            background: '#ECFDF5',
            color: '#047857',
            border: '1px solid #A7F3D0',
          }}
        >
          <CheckCircle2 size={13} /> Confirmé
        </span>
      );
    case 'NOTIFIED':
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '999px',
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
          }}
        >
          <Clock size={13} /> Notifié
        </span>
      );
    case 'REJECTED':
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '999px',
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA',
          }}
        >
          <XCircle size={13} /> Rejeté
        </span>
      );
    case 'PROPOSED':
    default:
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '999px',
            background: '#FFFBEB',
            color: '#B45309',
            border: '1px solid #FDE68A',
          }}
        >
          <Clock size={13} /> Proposé
        </span>
      );
  }
};
