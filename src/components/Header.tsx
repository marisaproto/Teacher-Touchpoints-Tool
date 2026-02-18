import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">📋</span>
          <span className="header-logo-text">Coaching Touchpoints</span>
        </Link>
      </div>
    </header>
  );
}
