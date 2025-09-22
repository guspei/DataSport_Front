import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { changePassword, getProposalsCount } from '../services/api';

function Sidebar({ user, setUser, isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [translationsExpanded, setTranslationsExpanded] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('translator_master');

  useEffect(() => {
    if (isAdmin) {
      loadProposalsCount();
      // Refresh proposals count every 30 seconds
      const interval = setInterval(loadProposalsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const loadProposalsCount = async () => {
    try {
      const res = await getProposalsCount();
      setPendingProposalsCount(res.data.count);
    } catch (err) {
      console.error('Error loading proposals count');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      alert('Password updated successfully');
    } catch (err) {
      setPasswordError('Error changing password');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isTranslationPath = () => {
    return location.pathname.startsWith('/translations');
  };

  const menuItems = [
    {
      name: 'Analytics',
      path: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['data_visualizator']
    },
    {
      name: 'Training Plans',
      path: '/training-plans',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      roles: ['admin', 'training_expert']
    },
  ];

  const translationSubItems = [
    { name: 'Screens', path: '/translations/screens' },
    { name: 'Translations', path: '/translations' },
    { 
      name: 'Proposals', 
      path: '/translations/review',
      badge: (isAdmin || user?.roles?.includes('translator_master')) && pendingProposalsCount > 0 ? pendingProposalsCount : null
    }
  ];

  const hasAccess = (roles) => {
    return roles.some(role => user?.roles?.includes(role));
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-30 bg-white shadow-lg transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Logo" className="h-8 w-8" />
              <span className="font-semibold text-gray-900">DS Milo Admin</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="flex justify-center w-full hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 flex-1 overflow-y-auto">
          <div className="space-y-2">

            {/* Main Menu Items */}
            {menuItems.map((item) => (
              hasAccess(item.roles) && (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-milo-red text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              )
            ))}

            {/* Translations Dropdown */}
            {hasAccess(['translator', 'translator_master', 'admin']) && (
              <div>
                <button
                  onClick={() => setTranslationsExpanded(!translationsExpanded)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isTranslationPath()
                      ? 'bg-milo-red text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Translations</span>}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2">
                      {(isAdmin || user?.roles?.includes('translator_master')) && pendingProposalsCount > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isTranslationPath()
                            ? 'bg-white text-milo-red'
                            : 'bg-milo-red text-white'
                        }`}>
                          {pendingProposalsCount}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          translationsExpanded ? 'rotate-90' : ''
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
                
                {/* Translations Submenu */}
                {!isCollapsed && translationsExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    {translationSubItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive(subItem.path)
                            ? 'bg-milo-red text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="ml-3">{subItem.name}</span>
                        {subItem.badge && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isActive(subItem.path)
                              ? 'bg-white text-milo-red'
                              : 'bg-milo-red text-white'
                          }`}>
                            {subItem.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t p-4 space-y-2 mt-auto">
          {/* User info */}
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs text-gray-500">
              <div>Logged in as:</div>
              <div className="font-medium">{user?.name}</div>
            </div>
          )}

          {/* Users Link */}
          {hasAccess(['admin']) && (
            <Link
              to="/users"
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/users')
                  ? 'bg-milo-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isCollapsed ? 'Users' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!isCollapsed && <span className="ml-3">Users</span>}
            </Link>
          )}

          {/* Change Password */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Change Password' : ''}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {!isCollapsed && <span className="ml-3">Change Password</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            title={isCollapsed ? 'Logout' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="ml-3">Log Out</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center px-2 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!isCollapsed && <span className="ml-2 text-xs">Collapse</span>}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Change password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-milo-red focus:border-milo-red"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-milo-red focus:border-milo-red"
                />
              </div>
              {passwordError && (
                <div className="text-red-600 text-sm mb-4">{passwordError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-milo-red hover:bg-milo-dark rounded"
                >
                  Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;