import { useState, useEffect } from 'react'

export default function ModalUsuario({ usuario, onSave, onClose }) {
  const isEdit = !!usuario

  const [form, setForm] = useState({
    nombre: '',
    plataforma: '',
    pin: '',
    activo: true,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || '',
        plataforma: usuario.plataforma || '',
        pin: '',
        activo: usuario.activo !== undefined ? usuario.activo : true,
      })
    }
  }, [usuario])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name === 'plataforma') {
      setForm(f => ({ ...f, plataforma: value.toUpperCase().slice(0, 6) }))
    } else if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (!form.plataforma.trim()) {
      setError('La plataforma es obligatoria.')
      return
    }
    if (!isEdit && !form.pin) {
      setError('El PIN es obligatorio para nuevos operarios.')
      return
    }
    if (form.pin && (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin))) {
      setError('El PIN debe ser de exactamente 4 dígitos.')
      return
    }

    const payload = {
      nombre: form.nombre.trim(),
      plataforma: form.plataforma.trim(),
      activo: form.activo,
    }
    if (form.pin) {
      payload.pin = form.pin
    }

    setSaving(true)
    try {
      await onSave(payload)
    } catch (err) {
      setError(err.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {isEdit ? 'Editar operario' : 'Nuevo operario'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del operario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plataforma
            </label>
            <input
              type="text"
              name="plataforma"
              value={form.plataforma}
              onChange={handleChange}
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="Ej: BCN01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN {isEdit && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
            </label>
            <input
              type="number"
              name="pin"
              value={form.pin}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="4 dígitos"
              min="1000"
              max="9999"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={form.activo}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Activo
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
