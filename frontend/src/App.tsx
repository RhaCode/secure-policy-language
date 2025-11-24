// frontend/src/App.tsx
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Code2, Moon, Sun, Zap, FileCode, Settings } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import CompilerPage from './pages/CompilerPage';
import ExecutionPage from './pages/ExecutionPage';
import ManagementPage from './pages/ManagementPage';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className={`h-screen flex flex-col transition-colors ${
      isDark ? 'bg-[#1C1C1E]' : 'bg-[#F3F4F6]'
    }`}>
      {/* Navbar */}
      <header className={`border-b ${isDark ? 'bg-[#242426] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} sticky top-0 z-50 shrink-0`}>
        <div className="px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Left - Branding & Navigation */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isDark ? 'bg-[#3F3F46]' : 'bg-[#E5E7EB]'} flex items-center justify-center rounded-lg`}>
                  <Code2 size={24} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>SPL Compiler</h1>
                  <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>Security Policy Language</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex gap-2">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    location.pathname === '/'
                      ? isDark
                        ? 'bg-[#3F3F46] text-[#60A5FA]'
                        : 'bg-[#E0E7FF] text-[#3730A3]'
                      : isDark
                      ? 'text-[#A1A1AA] hover:bg-[#3F3F46] hover:text-[#F3F4F6]'
                      : 'text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]'
                  }`}
                >
                  <FileCode size={16} />
                  Compiler
                </Link>
                <Link
                  to="/execution"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    location.pathname === '/execution'
                      ? isDark
                        ? 'bg-[#3F3F46] text-[#10B981]'
                        : 'bg-[#D1FAE5] text-[#065F46]'
                      : isDark
                      ? 'text-[#A1A1AA] hover:bg-[#3F3F46] hover:text-[#F3F4F6]'
                      : 'text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]'
                  }`}
                >
                  <Zap size={16} />
                  Execution
                </Link>
                <Link
                  to="/management"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    location.pathname === '/management'
                      ? isDark
                        ? 'bg-[#3F3F46] text-[#F59E0B]'
                        : 'bg-[#FEF3C7] text-[#92400E]'
                      : isDark
                      ? 'text-[#A1A1AA] hover:bg-[#3F3F46] hover:text-[#F3F4F6]'
                      : 'text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]'
                  }`}
                >
                  <Settings size={16} />
                  Management
                </Link>
              </nav>
            </div>

            {/* Right - Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg
                ${isDark
                  ? 'bg-[#3F3F46] text-[#FBBF24] hover:bg-[#52525B]'
                  : 'bg-[#E5E7EB] text-[#D97706] hover:bg-[#D1D5DB]'
                }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<CompilerPage />} />
          <Route path="/execution" element={<ExecutionPage />} />
          <Route path="/management" element={<ManagementPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;