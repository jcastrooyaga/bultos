export default function ModalCorreccion({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="text-4xl text-center mb-3">📦</div>
        <h2 className="text-base font-semibold text-text1 text-center mb-2">
          Bulto ya registrado
        </h2>
        <p className="text-sm text-text2 text-center mb-6">
          Este bulto ya fue registrado por ti hoy. ¿Quieres corregirlo?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center rounded-xl border border-border1 text-text1 font-medium text-sm bg-bg2 active:bg-bg3"
            style={{ minHeight: 52 }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center rounded-xl text-white font-semibold text-sm bg-blue-500 active:bg-blue-600"
            style={{ minHeight: 52 }}
          >
            Corregir
          </button>
        </div>
      </div>
    </div>
  );
}
