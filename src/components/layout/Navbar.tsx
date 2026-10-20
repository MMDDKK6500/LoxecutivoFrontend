import { FaSearch, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

interface NavbarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onLogout?: () => void;
}

export default function Navbar({ searchTerm, onSearchChange, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Gestão de Transporte & Logística</span>
      </div>

      <div className="navbar-navigation" aria-label="Navegação principal">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Dashboard</NavLink>
        <NavLink to="/cadastros/motoristas" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Motoristas</NavLink>
        <NavLink to="/cadastros/veiculos" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Veículos</NavLink>
        <NavLink to="/cadastros/enderecos" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Endereços</NavLink>
      </div>

      <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Pesquisar..." 
          value={searchTerm || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          style={{ paddingLeft: '35px' }}
        />
        <FaSearch style={{ position: 'absolute', left: '12px', color: '#a0aec0', fontSize: '0.9rem' }} />
      </div>

      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
          <FaUserCircle size={22} color="#cbd5e0" />
          <span>Administrador</span>
        </div>

        {onLogout && (
          <button 
            onClick={onLogout} 
            title="Terminar Sessão"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#e74c3c', 
              cursor: 'pointer', 
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaSignOutAlt />
          </button>
        )}
      </div>
    </nav>
  );
}
