export default function DimCard({ label, value, unit, active, locked, onClick }) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      className={[
        'flex flex-col items-center justify-center rounded-xl p-3 bg-white transition-all select-none',
        active ? 'border-2 border-gray-900 shadow-sm' : 'border border-border1',
        locked ? 'opacity-60 cursor-default' : 'active:bg-bg2',
      ].join(' ')}
      style={{ minHeight: 80 }}
    >
      <span className="text-xs text-text2 mb-1 flex items-center gap-1">
        {locked && <span>🔒</span>}
        {label}
      </span>
      <span className={['text-2xl font-semibold', value ? 'text-text1' : 'text-border2'].join(' ')}>
        {value || '—'}
      </span>
      <span className="text-xs text-text2 mt-0.5">{unit}</span>
    </button>
  );
}
