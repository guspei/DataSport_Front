import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';

function Layout({ user, setUser }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar 
        user={user} 
        setUser={setUser} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      <main className={`transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      } min-h-screen`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;