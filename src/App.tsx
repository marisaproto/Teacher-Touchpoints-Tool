import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AppProvider, useApp } from './context';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SchoolPage from './pages/SchoolPage';
import PersonPage from './pages/PersonPage';
import NewTouchpointPage from './pages/NewTouchpointPage';
import TouchpointViewPage from './pages/TouchpointViewPage';
import AdminPage from './pages/AdminPage';

// Renders inside AppProvider so it can read saveError from context
function AppShell() {
  const { saveError, clearSaveError } = useApp();
  return (
    <div className="app">
      {saveError && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#C53030', color: '#fff', padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem',
        }}>
          <span style={{ flex: 1 }}>{saveError}</span>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#fff', color: '#C53030', border: 'none', borderRadius: '4px', padding: '0.25rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Reload now
          </button>
          <button
            onClick={clearSaveError}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/school/:schoolId" element={<SchoolPage />} />
          <Route path="/school/:schoolId/person/:personId" element={<PersonPage />} />
          <Route path="/school/:schoolId/person/:personId/touchpoint/new" element={<NewTouchpointPage />} />
          <Route path="/school/:schoolId/person/:personId/touchpoint/:touchpointId" element={<TouchpointViewPage />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { currentUser, effectiveUserId, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '100vh', fontSize: '1rem', color: '#718096' }}>
        <span>Loading…</span>
        <button
          onClick={() => window.location.reload()}
          style={{ fontSize: '0.875rem', color: '#4A90E2', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Taking too long? Reload
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <AppProvider userId={effectiveUserId ?? currentUser.id}>
      <AppShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
