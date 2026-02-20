import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { supabase } from '../supabase';

interface CoachStats {
  schoolCount: number;
  personCount: number;
  touchpointCount: number;
  schoolNames: string[];
}

export default function AdminPage() {
  const { currentUser, allUsers, viewingUserId, setViewingUserId } = useAuth();
  const navigate = useNavigate();
  const [statsMap, setStatsMap] = useState<Record<string, CoachStats>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!currentUser?.isAdmin) return;

    async function loadStats() {
      setLoadingStats(true);
      const [
        { data: schools },
        { data: people },
        { data: touchpoints },
      ] = await Promise.all([
        supabase.from('schools').select('id, user_id, name'),
        supabase.from('people').select('id, user_id'),
        supabase.from('touchpoints').select('id, user_id'),
      ]);

      const map: Record<string, CoachStats> = {};

      (schools ?? []).forEach(s => {
        if (!map[s.user_id]) map[s.user_id] = { schoolCount: 0, personCount: 0, touchpointCount: 0, schoolNames: [] };
        map[s.user_id].schoolCount += 1;
        map[s.user_id].schoolNames.push(s.name);
      });
      (people ?? []).forEach(p => {
        if (!map[p.user_id]) map[p.user_id] = { schoolCount: 0, personCount: 0, touchpointCount: 0, schoolNames: [] };
        map[p.user_id].personCount += 1;
      });
      (touchpoints ?? []).forEach(t => {
        if (!map[t.user_id]) map[t.user_id] = { schoolCount: 0, personCount: 0, touchpointCount: 0, schoolNames: [] };
        map[t.user_id].touchpointCount += 1;
      });

      setStatsMap(map);
      setLoadingStats(false);
    }

    loadStats();
  }, [currentUser]);

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

  function handleViewCoach(userId: string) {
    setViewingUserId(userId);
    navigate('/');
  }

  function handleClearView() {
    setViewingUserId(null);
  }

  const emptyStats: CoachStats = { schoolCount: 0, personCount: 0, touchpointCount: 0, schoolNames: [] };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">{allUsers.length} account{allUsers.length !== 1 ? 's' : ''} registered</p>
        </div>
        {viewingUserId && (
          <button className="btn btn-secondary" onClick={handleClearView}>
            ← Return to My Workspace
          </button>
        )}
      </div>

      {loadingStats ? (
        <p style={{ color: '#718096' }}>Loading stats…</p>
      ) : (
        <div className="admin-coach-grid">
          {allUsers.map(coach => {
            const data = statsMap[coach.id] ?? emptyStats;
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
                    <span className="admin-stat-value">{data.schoolCount}</span>
                    <span className="admin-stat-label">School{data.schoolCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="admin-stat">
                    <span className="admin-stat-value">{data.personCount}</span>
                    <span className="admin-stat-label">Contact{data.personCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="admin-stat">
                    <span className="admin-stat-value">{data.touchpointCount}</span>
                    <span className="admin-stat-label">Touchpoint{data.touchpointCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {data.schoolNames.length > 0 && (
                  <div className="admin-coach-schools">
                    {data.schoolNames.map((name, i) => (
                      <span key={i} className="admin-school-chip">{name}</span>
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
      )}
    </div>
  );
}
