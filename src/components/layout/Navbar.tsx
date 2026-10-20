import { FaSearch, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

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