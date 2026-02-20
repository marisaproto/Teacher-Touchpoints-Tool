import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Header() {
  const { currentUser, allUsers, viewingUserId, setViewingUserId, logout } = useAuth();
  const navigate = useNavigate();

  const viewingUser = viewingUserId ? allUsers.find(u => u.id === viewingUserId) : null;

  function handleReturnToMyData() {
    setViewingUserId(null);
    navigate('/');
  }

  return (
    <>
      {viewingUser && (
        <div className="viewing-banner">
          <span>Viewing <strong>{viewingUser.displayName}</strong>'s workspace</span>
          <button className="viewing-banner-btn" onClick={handleReturnToMyData}>
            ← Return to my data
          </button>
        </div>
      )}
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="header-logo">
            <span className="header-logo-icon">📋</span>
            <span className="header-logo-text">Coaching Touchpoints</span>
          </Link>
          {currentUser && (
            <div className="header-user">
              {currentUser.isAdmin && (
                <Link to="/admin" className="header-admin-link">
                  Admin
                </Link>
              )}
              <span className="header-user-name">{currentUser.displayName}</span>
              <button className="header-logout" onClick={logout} title="Sign out">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
