export default function Lista({ registros, onEdit }) {
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDims = (r) => {
    const parts = [r.alto_cm, r.ancho_cm, r.largo_cm].filter((v) => v != null);
    if (!parts.length) return null;
    return parts.join(' × ');
  };

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold text-text1">Registros de hoy</h2>
        <span className="inline-flex items-center justify-center bg-gray-900 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
          {registros.length} bulto{registros.length !== 1 ? 's' : ''}
        </span>
      </div>

      {registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text2">
          <span className="text-4xl mb-3">📦</span>
          <p className="text-sm">Aún no hay registros hoy</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {registros.map((r) => {
            const dims = formatDims(r);
            const vol = r.volumen_m3 != null
              ? `${Number(r.volumen_m3).toFixed(2)} m³`
              : null;

            return (
              <button
                key={r.local_id || r.id}
                onClick={() => onEdit(r)}
                className="flex items-center bg-white border border-border1 rounded-xl px-4 py-3 gap-3 text-left active:bg-bg2 w-full"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text1 font-mono truncate">
                    {r.codigo_barras}
                  </p>
                  <p className="text-xs text-text2 mt-0.5">
                    {dims ? `${dims} · ` : ''}{formatTime(r.fecha_hora_utc)}
                  </p>
                  {r.peso_kg != null && (
                    <p className="text-xs text-text2 mt-0.5">{r.peso_kg} kg</p>
                  )}
                </div>
                {vol && (
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-semibold text-blue-700">{vol}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
