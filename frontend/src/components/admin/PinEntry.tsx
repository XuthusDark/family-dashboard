import { useState, useEffect } from 'react';
import { useDashboard } from '../../store';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinEntry({ onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const verifyPin = useDashboard(s => s.verifyPin);

  useEffect(() => {
    if (pin.length === 4) {
      verifyPin(pin).then(ok => {
        if (ok) {
          onSuccess();
        } else {
          setError('Incorrect PIN');
          setPin('');
        }
      });
    }
  }, [pin, verifyPin, onSuccess]);

  function pressDigit(d: string) {
    setError('');
    if (pin.length < 4) setPin(p => p + d);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
      <div className="rounded-2xl p-8 flex flex-col items-center gap-6 w-80" style={{ background: 'var(--color-surface)' }}>
        <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Admin PIN</div>

        {/* Dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all"
              style={{ background: i < pin.length ? 'var(--color-accent)' : 'var(--color-bg)', border: '2px solid var(--color-accent)' }}
            />
          ))}
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <button
              key={i}
              onClick={() => k === '⌫' ? setPin(p => p.slice(0,-1)) : k ? pressDigit(k) : undefined}
              disabled={!k}
              className="w-16 h-16 rounded-xl text-xl font-semibold transition-colors disabled:opacity-0"
              style={{
                background: k ? 'var(--color-bg)' : 'transparent',
                color: 'var(--color-text)'
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-sm opacity-50 hover:opacity-80"
          style={{ color: 'var(--color-subtext)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
