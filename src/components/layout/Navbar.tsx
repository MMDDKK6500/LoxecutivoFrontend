import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

interface NavbarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onLogout?: () => void;
}

export default function Navbar({ searchTerm, onSearchChange, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>Gestão de Transporte & Logística</span>
      </div>

      <div className="navbar-navigation" aria-label="Navegação principal">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Dashboard</NavLink>
        <NavLink to="/cadastros/motoristas" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Motoristas</NavLink>
        <NavLink to="/cadastros/veiculos" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Veículos</NavLink>
        <NavLink to="/cadastros/enderecos" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Endereços</NavLink>
        <NavLink to="/relatorios" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>Relatórios</NavLink>
      </div>

      <GlobalSearch value={searchTerm || ''} onChange={(term) => onSearchChange?.(term)} />

      <div className="navbar-actions">
        <NavLink to="/seguranca" className="navbar-user" style={{ color: 'inherit', textDecoration: 'none' }} title="Segurança da conta">
          <FaUserCircle aria-hidden="true" />
          <span>Administrador</span>
        </NavLink>

        {onLogout && (
          <button
            type="button"
            className="navbar-logout"
            onClick={onLogout}
            title="Terminar Sessão"
            aria-label="Terminar sessão"
          >
            <FaSignOutAlt aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}
