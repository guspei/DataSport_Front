import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Translations from './pages/Translations';  // <-- Uncomment this
import ReviewTranslations from './pages/ReviewTranslations';  // <-- Uncomment this
import ScreensManagement from './pages/ScreensManagement';
import MyProposals from './pages/MyProposals';
import Analytics from './pages/Analytics';
import TrainingPlans from './pages/TrainingPlans';
import Layout from './components/Layout';
import { getMe } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login setUser={setUser} />
        } />
        
        <Route path="/" element={
          !user ? <Navigate to="/login" /> : <Layout user={user} setUser={setUser} />
        }>
          <Route index element={<Dashboard user={user} />} />
          <Route path="analytics" element={
            user?.roles?.includes('data_visualizator') ? 
              <Analytics user={user} /> : 
              <Navigate to="/" />
          } />
          <Route path="training-plans" element={
            (user?.roles?.includes('admin') || user?.roles?.includes('training_expert')) ? 
              <TrainingPlans user={user} /> : 
              <Navigate to="/" />
          } />
          <Route path="users" element={
            user?.roles?.includes('admin') ? 
              <Users /> : 
              <Navigate to="/" />
          } />
          {/* ⚠️ DO NOT COMMENT OR REMOVE THESE ROUTES - They are essential for the translation system */}
          <Route path="translations" element={
            (user?.roles?.includes('translator') || user?.roles?.includes('translator_master') || user?.roles?.includes('admin')) ? 
              <Translations user={user} /> : 
              <Navigate to="/" />
          } />
          <Route path="translations/my-proposals" element={
            (user?.roles?.includes('translator') || user?.roles?.includes('translator_master') || user?.roles?.includes('admin')) ?
              <MyProposals user={user} /> :
              <Navigate to="/" />
          } />
          <Route path="translations/review" element={
            (user?.roles?.includes('translator_master') || user?.roles?.includes('admin')) ?
              <ReviewTranslations /> :
              <Navigate to="/" />
          } />
          <Route path="translations/screens" element={
            (user?.roles?.includes('translator') || user?.roles?.includes('translator_master') || user?.roles?.includes('admin')) ?
              <ScreensManagement user={user} /> :
              <Navigate to="/" />
          } />
          {/* ⚠️ END OF TRANSLATION ROUTES - DO NOT MODIFY */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;