// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Code2, Moon, Sun, Zap, FileCode, Settings, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import CompilerPage from './pages/CompilerPage';
import ExecutionPage from './pages/ExecutionPage';
import ManagementPage from './pages/ManagementPage';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, we want the sidebar to be fully visible when open, not collapsed
      if (mobile) {
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile, isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    // Don't allow collapsing on mobile - we need the icons to be always accessible
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const navItems = [
    {
      path: '/',
      label: 'Compiler',
      icon: FileCode,
      color: isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]',
      bgColor: isDark ? 'bg-[#3F3F46]' : 'bg-[#E0E7FF]'
    },
    {
      path: '/execution',
      label: 'Execution',
      icon: Zap,
      color: isDark ? 'text-[#10B981]' : 'text-[#065F46]',
      bgColor: isDark ? 'bg-[#3F3F46]' : 'bg-[#D1FAE5]'
    },
    {
      path: '/management',
      label: 'Management',
      icon: Settings,
      color: isDark ? 'text-[#F59E0B]' : 'text-[#92400E]',
      bgColor: isDark ? 'bg-[#3F3F46]' : 'bg-[#FEF3C7]'
    }
  ];

  const SidebarContent = () => (
    <>
      {/* Branding - Hidden when collapsed on desktop, always visible on mobile */}
      <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'} p-4 border-b ${isDark ? 'border-[#3F3F46]' : 'border-[#D1D5DB]'}`}>
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isDark ? 'bg-[#3F3F46]' : 'bg-[#E5E7EB]'} flex items-center justify-center rounded-lg`}>
              <Code2 size={24} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>SPL Compiler</h1>
              <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>Security Policy Language</p>
            </div>
          </div>
        )}
        
        {/* Collapse Toggle - Only show on desktop */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDark ? 'hover:bg-[#3F3F46] text-[#A1A1AA]' : 'hover:bg-[#E5E7EB] text-[#6B7280]'
            }`}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showLabels = !isCollapsed || isMobile;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all group relative ${
                isActive
                  ? `${item.bgColor} ${item.color}`
                  : isDark
                  ? 'text-[#A1A1AA] hover:bg-[#3F3F46] hover:text-[#F3F4F6]'
                  : 'text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]'
              } ${!showLabels ? 'justify-center' : ''}`}
            >
              <Icon size={20} />
              {showLabels && <span>{item.label}</span>}
              
              {/* Tooltip for collapsed state on desktop */}
              {!showLabels && !isMobile && (
                <div className={`absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
                  isDark ? 'bg-[#3F3F46] text-[#F3F4F6]' : 'bg-[#E5E7EB] text-[#111827]'
                }`}>
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className={`p-2 border-t ${isDark ? 'border-[#3F3F46]' : 'border-[#D1D5DB]'}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full p-3 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 ${
            isDark
              ? 'bg-[#3F3F46] text-[#FBBF24] hover:bg-[#52525B]'
              : 'bg-[#E5E7EB] text-[#D97706] hover:bg-[#D1D5DB]'
          } ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          {(!isCollapsed || isMobile) && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          
          {/* Tooltip for collapsed state on desktop */}
          {(isCollapsed && !isMobile) && (
            <div className={`absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
              isDark ? 'bg-[#3F3F46] text-[#F3F4F6]' : 'bg-[#E5E7EB] text-[#111827]'
            }`}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className={`h-screen flex transition-colors ${
      isDark ? 'bg-[#1C1C1E]' : 'bg-[#F3F4F6]'
    }`}>
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        flex flex-col transition-all duration-300 ease-in-out z-50
        ${isMobile 
          ? `fixed inset-y-0 left-0 transform ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } w-64`
          : `relative ${
              isCollapsed ? 'w-16' : 'w-64'
            }`
        }
        ${isDark ? 'bg-[#242426] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} 
        border-r
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 `}>
        {/* Mobile Header - Only show menu button */}
        {isMobile && (
          <div className={`border-b ${isDark ? 'bg-[#242426] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} sticky top-0 z-30 shrink-0 lg:hidden`}>
            <div className="px-4 py-3">
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg transition-all duration-200 active:scale-95 ${
                  isDark 
                    ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' 
                    : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'
                }`}
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area - Full height without extra headers */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<CompilerPage />} />
            <Route path="/execution" element={<ExecutionPage />} />
            <Route path="/management" element={<ManagementPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;