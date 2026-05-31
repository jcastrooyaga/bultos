export default function BottomNav({ activeTab, onNavigate, onSalir }) {
  const inRegistrar = activeTab === 'registrar';

  return (
    <div className="fixed bottom-0 left-0 right-0 flex border-t border-border1 bg-white z-10">
      {inRegistrar ? (
        <button
          onClick={() => onNavigate('lista')}
          className="flex-1 flex flex-col items-center justify-center py-3 text-text2 active:bg-bg2"
          style={{ minHeight: 56 }}
        >
          <span className="text-xl">📋</span>
          <span className="text-xs mt-0.5">Lista</span>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('registrar')}
          className="flex-1 flex flex-col items-center justify-center py-3 text-text2 active:bg-bg2"
          style={{ minHeight: 56 }}
        >
          <span className="text-xl">📦</span>
          <span className="text-xs mt-0.5">Registrar</span>
        </button>
      )}

      <div className="w-px bg-border1" />

      <button
        onClick={onSalir}
        className="flex-1 flex flex-col items-center justify-center py-3 text-red-600 active:bg-bg2"
        style={{ minHeight: 56 }}
      >
        <span className="text-xl">🚪</span>
        <span className="text-xs mt-0.5">Salir</span>
      </button>
    </div>
  );
}
