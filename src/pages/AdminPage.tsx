import { useNavigate } from 'react-router-dom';
import { useAuth, loadUsers } from '../auth';
import { School, Person, Touchpoint } from '../types';

interface CoachData {
  schools: School[];
  people: Person[];
  touchpoints: Touchpoint[];
}

function loadCoachData(userId: string): CoachData {
  try {
    const raw = localStorage.getItem(`coaching-touchpoints-v1-${userId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { schools: [], people: [], touchpoints: [] };
}

export default function AdminPage() {
  const { currentUser, allUsers, viewingUserId, setViewingUserId } = useAuth();
  const navigate = useNavigate();

  if (!currentUser?.isAdmin) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Only admin accounts can view this page.</p>
        </div>
      </div>
    );
  }

  const coaches = loadUsers();

  function handleViewCoach(userId: string) {
    setViewingUserId(userId);
    navigate('/');
  }

  function handleClearView() {
    setViewingUserId(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">{coaches.length} account{coaches.length !== 1 ? 's' : ''} registered</p>
        </div>
        {viewingUserId && (
          <button className="btn btn-secondary" onClick={handleClearView}>
            ← Return to My Workspace
          </button>
        )}
      </div>

      <div className="admin-coach-grid">
        {coaches.map(coach => {
          const data = loadCoachData(coach.id);
          const isViewing = viewingUserId === coach.id;
          const isMe = coach.id === currentUser.id;

          return (
            <div key={coach.id} className={`admin-coach-card${isViewing ? ' admin-coach-card--viewing' : ''}`}>
              <div className="admin-coach-header">
                <div className="admin-coach-avatar">{coach.displayName.charAt(0).toUpperCase()}</div>
                <div className="admin-coach-info">
                  <span className="admin-coach-name">
                    {coach.displayName}
                    {isMe && <span className="admin-badge-me">You</span>}
                    {coach.isAdmin && <span className="admin-badge-admin">Admin</span>}
                  </span>
                  <span className="admin-coach-username">@{coach.username}</span>
                </div>
              </div>

              <div className="admin-coach-stats">
                <div className="admin-stat">
                  <span className="admin-stat-value">{data.schools.length}</span>
                  <span className="admin-stat-label">School{data.schools.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="admin-stat">
                  <span className="admin-stat-value">{data.people.length}</span>
                  <span className="admin-stat-label">Contact{data.people.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="admin-stat">
                  <span className="admin-stat-value">{data.touchpoints.length}</span>
                  <span className="admin-stat-label">Touchpoint{data.touchpoints.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {data.schools.length > 0 && (
                <div className="admin-coach-schools">
                  {data.schools.map(s => (
                    <span key={s.id} className="admin-school-chip">{s.name}</span>
                  ))}
                </div>
              )}

              <div className="admin-coach-actions">
                {isViewing ? (
                  <button className="btn btn-secondary btn-sm" onClick={handleClearView}>
                    Viewing — Return to My Data
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewCoach(coach.id)}
                    disabled={isMe}
                    title={isMe ? 'This is your own workspace' : `View ${coach.displayName}'s workspace`}
                  >
                    {isMe ? 'Your Workspace' : `View ${coach.displayName}'s Workspace`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
