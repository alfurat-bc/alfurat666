import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './services/api';
import type { User } from './types';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import SurveyPage from './pages/SurveyPage';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import SurveysPage from './pages/admin/SurveysPage';
import SurveyEditorPage from './pages/admin/SurveyEditorPage';
import SurveyResponsesPage from './pages/admin/SurveyResponsesPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import SuperAdminUsers from './pages/admin/SuperAdminUsers';
import SuperAdminSurveys from './pages/admin/SuperAdminSurveys';
import ParticipantInfo from './pages/ParticipantInfo';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(({ user }) => setUser(user))
        .catch(() => {
          api.logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - English survey pages */}
        <Route element={<MainLayout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route path="/info-sheet" element={<ParticipantInfo />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={
          user ? <Navigate to="/admin" replace /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/admin" replace /> : <RegisterPage onLogin={handleLogin} />
        } />

        {/* Admin routes - Chinese interface */}
        <Route path="/admin" element={
          user ? <AdminLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        }>
          <Route index element={
            user?.role === 'super_admin' 
              ? <SuperAdminDashboard />
              : <DashboardPage />
          } />
          <Route path="surveys" element={<SurveysPage />} />
          <Route path="surveys/create" element={<SurveyEditorPage />} />
          <Route path="surveys/edit/:id" element={<SurveyEditorPage />} />
          <Route path="surveys/responses/:id" element={<SurveyResponsesPage />} />
          
          {/* Super admin routes */}
          {user?.role === 'super_admin' && (
            <>
              <Route path="users" element={<SuperAdminUsers />} />
              <Route path="all-surveys" element={<SuperAdminSurveys />} />
            </>
          )}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
