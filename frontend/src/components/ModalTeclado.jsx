import { useState } from 'react';

const ALPHA_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
];

const NUM_KEYS = [
  '1','2','3',
  '4','5','6',
  '7','8','9',
  '-','0','⌫',
];

export default function ModalTeclado({ onConfirm, onClose }) {
  const [input, setInput] = useState('');
  const [alphaMode, setAlphaMode] = useState(false);

  const handleKey = (k) => {
    if (k === '⌫') {
      setInput((v) => v.slice(0, -1));
    } else {
      setInput((v) => v + k);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={onClose}>
      <div
        className="mt-auto bg-white rounded-t-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border1">
          <div className="flex-1 bg-bg2 rounded-xl px-4 flex items-center" style={{ minHeight: 48 }}>
            <span className={['flex-1 text-base font-mono', input ? 'text-text1' : 'text-border2'].join(' ')}>
              {input || 'Código de barras'}
            </span>
            {input && (
              <button
                onPointerDown={(e) => { e.preventDefault(); setInput(''); }}
                className="text-text2 text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text2 px-2 py-1 text-sm"
          >
            Cancelar
          </button>
        </div>

        <div className="px-3 pt-3 pb-2">
          <div className="flex justify-between items-center mb-2">
            <button
              onPointerDown={(e) => { e.preventDefault(); setAlphaMode((v) => !v); }}
              className={[
                'px-4 rounded-xl text-sm font-medium border transition-colors',
                alphaMode
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-bg2 text-text2 border-border1',
              ].join(' ')}
              style={{ minHeight: 36 }}
            >
              A-Z
            </button>
            <button
              onPointerDown={(e) => { e.preventDefault(); }}
              onClick={() => { if (input.trim()) onConfirm(input.trim()); }}
              disabled={!input.trim()}
              className="px-6 rounded-xl text-sm font-semibold text-white bg-blue-500 disabled:opacity-40"
              style={{ minHeight: 36 }}
            >
              Confirmar
            </button>
          </div>

          {alphaMode ? (
            <div className="space-y-1.5">
              {ALPHA_ROWS.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-1">
                  {row.map((k) => (
                    <button
                      key={k}
                      onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}
                      className={[
                        'flex items-center justify-center rounded-lg font-semibold text-sm select-none active:scale-95 transition-transform',
                        k === '⌫' ? 'bg-bg3 text-text1 px-3' : 'bg-bg2 text-text1',
                      ].join(' ')}
                      style={{ minWidth: k === '⌫' ? 48 : 32, minHeight: 44 }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex justify-center gap-1 mt-1">
                {['0','1','2','3','4','5','6','7','8','9','-'].map((k) => (
                  <button
                    key={k}
                    onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}
                    className="flex items-center justify-center rounded-lg bg-bg2 text-text1 font-semibold text-sm select-none active:scale-95"
                    style={{ minWidth: 30, minHeight: 40 }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {NUM_KEYS.map((k, i) => (
                <button
                  key={i}
                  onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}
                  className={[
                    'flex items-center justify-center rounded-xl font-semibold text-xl select-none active:scale-95 transition-transform',
                    k === '⌫' ? 'bg-bg3 text-text1' : 'bg-bg2 text-text1',
                  ].join(' ')}
                  style={{ minHeight: 56 }}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
