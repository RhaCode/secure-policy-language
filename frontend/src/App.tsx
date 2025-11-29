// frontend/src/App.tsx
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Code2, Moon, Sun, Zap, FileCode } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import CompilerPage from './pages/CompilerPage';
import ExecutionPage from './pages/ExecutionPage';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

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
    }
  ];

  return (
    <div className={`h-screen flex flex-col transition-colors ${
      isDark ? 'bg-[#1C1C1E]' : 'bg-[#F3F4F6]'
    }`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-[#242426] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} border-b shrink-0`}>
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isDark ? 'bg-[#3F3F46]' : 'bg-[#E5E7EB]'} flex items-center justify-center rounded-lg`}>
              <Code2 size={24} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
            </div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                AuthScript
              </h1>
            <div className="hidden sm:block">
              <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                Security Policy Language Compiler
              </p>
            </div>
          </div>

          <div className='flex flex-row gap-2'>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? `${item.bgColor} ${item.color}`
                      : isDark
                      ? 'text-[#A1A1AA] hover:bg-[#3F3F46] hover:text-[#F3F4F6]'
                      : 'text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 ${
              isDark
                ? 'bg-[#3F3F46] text-[#FBBF24] hover:bg-[#52525B]'
                : 'bg-[#E5E7EB] text-[#D97706] hover:bg-[#D1D5DB]'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<CompilerPage />} />
          <Route path="/execution" element={<ExecutionPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;