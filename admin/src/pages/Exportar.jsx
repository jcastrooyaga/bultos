import { useState } from 'react'
import { exportData } from '../api.js'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function Exportar() {
  const [desde, setDesde] = useState(today())
  const [hasta, setHasta] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    setError('')
    if (!desde || !hasta) {
      setError('Selecciona un rango de fechas.')
      return
    }
    if (desde > hasta) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.')
      return
    }
    setLoading(true)
    try {
      const res = await exportData(desde, hasta)
      if (!res) return
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Error al exportar los datos.')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bultos_${desde}_${hasta}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Exportar registros</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Descargando...' : 'Descargar Excel'}
        </button>
      </div>
    </div>
  )
}
