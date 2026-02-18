import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SchoolPage from './pages/SchoolPage';
import PersonPage from './pages/PersonPage';
import NewTouchpointPage from './pages/NewTouchpointPage';
import TouchpointViewPage from './pages/TouchpointViewPage';

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
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
