import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AppProvider } from './context';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SchoolPage from './pages/SchoolPage';
import PersonPage from './pages/PersonPage';
import NewTouchpointPage from './pages/NewTouchpointPage';
import TouchpointViewPage from './pages/TouchpointViewPage';
import AdminPage from './pages/AdminPage';

function AuthenticatedApp() {
  const { currentUser, effectiveUserId, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1rem', color: '#718096' }}>
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <AppProvider userId={effectiveUserId ?? currentUser.id}>
      <div className="app">
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
