import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep">›</span>}
          {crumb.to ? (
            <Link to={crumb.to} className="breadcrumb-link">{crumb.label}</Link>
          ) : (
            <span className="breadcrumb-current">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
