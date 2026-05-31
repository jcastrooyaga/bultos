export default function TopBar({ user, isOnline, pendingCount }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border1 sticky top-0 z-10">
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-text1">{user?.nombre}</span>
        <span className="text-xs text-text2">{user?.plataforma}</span>
      </div>

      <div className="flex-1 flex justify-center px-2">
        {isOnline && pendingCount === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
            ✓ Sincronizado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            {isOnline ? '↑' : '●'} Sin conexión{pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}` : ''}
          </span>
        )}
      </div>

      <div
        className="flex items-center justify-center rounded-xl text-white font-bold text-xs shrink-0"
        style={{ width: 28, height: 28, background: '#25578f' }}
      >
        cat
      </div>
    </div>
  );
}
