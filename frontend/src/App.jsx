// src/App.jsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore.js';
import useUIStore from './stores/uiStore.js';
import useNotificationsStore from './stores/notificationsStore.js';
import { socket } from './socket/socket.js';
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
const PrivateChatPage  = lazy(() => import('./pages/PrivateChatPage.jsx'));
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
  const showToast = useUIStore((s) => s.showToast);
  const fetchUnseen = useNotificationsStore((s) => s.fetchUnseen);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handleGlobalNotification = (event, type) => {
      let msg = '';
      if (type === 'friend_request') msg = `Friend request from ${event.from}`;
      else if (type === 'friend_request_accepted') msg = `Friend request accepted`;
      else if (type === 'friend_request_rejected') msg = `Friend request rejected`;
      else if (type === 'private_message') msg = `New private message`;
      else if (type === 'group_message') msg = `New message in ${event.groupName || 'group'}`;
      
      if (msg) showToast(msg, 'info');
      fetchUnseen();
    };

    socket.on('friend_request', (e) => handleGlobalNotification(e, 'friend_request'));
    socket.on('friend_request_accepted', (e) => handleGlobalNotification(e, 'friend_request_accepted'));
    socket.on('friend_request_rejected', (e) => handleGlobalNotification(e, 'friend_request_rejected'));
    socket.on('receive_private_message', (e) => handleGlobalNotification(e, 'private_message'));
    
    // We don't trigger toast for group_message here to avoid duplicate if user is in chat,
    // but we do update unseen count.
    socket.on('receive_group_message', (e) => {
      fetchUnseen();
    });

    socket.on('new_notification', (e) => {
      if (e?.message) showToast(e.message, 'info');
      fetchUnseen();
    });

    return () => {
      socket.off('friend_request');
      socket.off('friend_request_accepted');
      socket.off('friend_request_rejected');
      socket.off('receive_private_message');
      socket.off('receive_group_message');
      socket.off('new_notification');
    };
  }, [showToast, fetchUnseen]);

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
            <Route path="chat/:userId"  element={<PrivateChatPage />} />
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
