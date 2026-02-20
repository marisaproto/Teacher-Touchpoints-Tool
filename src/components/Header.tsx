import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Header() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">📋</span>
          <span className="header-logo-text">Coaching Touchpoints</span>
        </Link>
        {currentUser && (
          <div className="header-user">
            <span className="header-user-name">{currentUser.displayName}</span>
            <button className="header-logout" onClick={logout} title="Sign out">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
