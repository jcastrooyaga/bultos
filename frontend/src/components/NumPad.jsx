export default function NumPad({ onKey, mode = 'dim' }) {
  const decimal = mode === 'dim' ? '·' : null;

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    decimal, '0', '⌫',
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 px-2">
      {keys.map((k, i) => {
        if (k === null) {
          return <div key={i} />;
        }
        return (
          <button
            key={i}
            onPointerDown={(e) => { e.preventDefault(); onKey(k); }}
            className={[
              'flex items-center justify-center rounded-xl font-semibold text-xl select-none active:scale-95 transition-transform',
              k === '⌫'
                ? 'bg-bg3 text-text1'
                : 'bg-bg2 text-text1',
            ].join(' ')}
            style={{ minHeight: 56 }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
