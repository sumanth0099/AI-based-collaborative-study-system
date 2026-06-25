// src/pages/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import useUIStore from '../stores/uiStore.js';
import './Layout.css';

export default function Layout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className={`main-content ${sidebarOpen ? 'main-sidebar-open' : 'main-sidebar-closed'}`}>
          <div className="page-wrapper animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
