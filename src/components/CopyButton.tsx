import { useState } from 'react';

export default function CopyButton({ onCopy, label, disabled = false }: {
  onCopy: () => Promise<void>; label: string; disabled?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'done' | 'error'>('idle');
  return <div className="copy-control">
    <button className="button-secondary copy-button" disabled={disabled || status === 'copying'} onClick={async () => {
      setStatus('copying');
      try { await onCopy(); setStatus('done'); } catch { setStatus('error'); }
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>
      {label}
    </button>
    <span className="copy-feedback" role="status">{status === 'done' ? 'Copiado' : status === 'error' ? 'No se pudo copiar. Inténtalo de nuevo.' : ''}</span>
  </div>;
}
