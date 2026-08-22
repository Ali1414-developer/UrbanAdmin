import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ReceptionSidebar from './ReceptionSidebar';
import ReceptionHeader from './ReceptionHeader';
import Toast from '../../Toast';

export default function ReceptionLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="reception-layout">
      <ReceptionSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <ReceptionHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
