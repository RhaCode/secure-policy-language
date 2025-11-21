import React from 'react';
import { Shield, Github, BookOpen } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">SPL Compiler</h1>
              <p className="text-sm text-gray-500">Secure Policy Language</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <BookOpen size={18} />
              Documentation
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;