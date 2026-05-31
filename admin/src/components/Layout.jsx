import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const admin = JSON.parse(localStorage.getItem('admin') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#25578f' }}
          >
            B
          </div>
          <p className="text-white font-semibold mt-3 text-sm">Bultos Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/usuarios" className={linkClass}>
            Usuarios
          </NavLink>
          <NavLink to="/exportar" className={linkClass}>
            Exportar
          </NavLink>
          <NavLink to="/cambiar-password" className={linkClass}>
            Cambiar contraseña
          </NavLink>
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            <PageTitle />
          </h1>
          <span className="text-sm text-gray-500">{admin.username || 'Admin'}</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function PageTitle() {
  const path = window.location.pathname
  if (path.startsWith('/usuarios')) return 'Usuarios'
  if (path.startsWith('/exportar')) return 'Exportar'
  if (path.startsWith('/cambiar-password')) return 'Cambiar contraseña'
  return 'Administración'
}
