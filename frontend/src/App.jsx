// src/App.jsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore.js';
import Layout from './pages/Layout.jsx';
import './styles/global.css';
import './styles/animations.css';

// Lazy-loaded pages
const LoginPage        = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage.jsx'));
const HomePage         = lazy(() => import('./pages/HomePage.jsx'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage.jsx'));
const NotesPage        = lazy(() => import('./pages/NotesPage.jsx'));
const NoteDetailPage   = lazy(() => import('./pages/NoteDetailPage.jsx'));
const ResourcesPage    = lazy(() => import('./pages/ResourcesPage.jsx'));
const GroupsPage       = lazy(() => import('./pages/GroupsPage.jsx'));
const GroupDetailPage  = lazy(() => import('./pages/GroupDetailPage.jsx'));
const MyGroupsPage     = lazy(() => import('./pages/MyGroupsPage.jsx'));
const FriendsPage      = lazy(() => import('./pages/FriendsPage.jsx'));
const AIPage           = lazy(() => import('./pages/AIPage.jsx'));
const NotificationsPage= lazy(() => import('./pages/NotificationsPage.jsx'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage.jsx'));

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-base)' }}>
      <div className="spinner" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Guest routes */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected routes inside Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home"          element={<HomePage />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="notes"         element={<NotesPage />} />
            <Route path="notes/:id"     element={<NoteDetailPage />} />
            <Route path="resources"     element={<ResourcesPage />} />
            <Route path="groups"        element={<GroupsPage />} />
            <Route path="groups/:id"    element={<GroupDetailPage />} />
            <Route path="my-groups"     element={<MyGroupsPage />} />
            <Route path="friends"       element={<FriendsPage />} />
            <Route path="ai"            element={<AIPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile"       element={<ProfilePage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
