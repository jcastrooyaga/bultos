import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser } from '../api.js'
import ModalUsuario from '../components/ModalUsuario.jsx'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Usuarios() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await getUsers()
      if (res && res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setError('Error al cargar los usuarios.')
      }
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  function openCreate() {
    setEditingUser(null)
    setShowModal(true)
  }

  function openEdit(user) {
    setEditingUser(user)
    setShowModal(true)
  }

  async function handleSave(payload) {
    if (editingUser) {
      const res = await updateUser(editingUser.id, payload)
      if (!res || !res.ok) {
        const data = await res?.json().catch(() => ({}))
        throw new Error(data.message || 'Error al actualizar el usuario.')
      }
    } else {
      const res = await createUser(payload)
      if (!res || !res.ok) {
        const data = await res?.json().catch(() => ({}))
        throw new Error(data.message || 'Error al crear el usuario.')
      }
    }
    setShowModal(false)
    fetchUsers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Operarios</h2>
        <button
          onClick={openCreate}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          + Nuevo operario
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay operarios registrados</p>
          <p className="text-sm mt-1">Crea el primero con el botón de arriba</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plataforma</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha alta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800 font-medium">{user.nombre}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{user.plataforma}</td>
                  <td className="px-4 py-3">
                    {user.activo ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt || user.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ModalUsuario
          usuario={editingUser}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
