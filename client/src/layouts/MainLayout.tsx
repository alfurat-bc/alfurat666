import { Outlet, Link } from 'react-router-dom';
import { FileText, Info } from 'lucide-react';
import type { User } from '../types';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Murdoch University</h1>
              <p className="text-xs text-gray-500">International Student Survey</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link 
              to="/info-sheet" 
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Participant Information</span>
            </Link>
            {user ? (
              <>
                <Link to="/admin" className="text-sm text-gray-600 hover:text-primary-600">
                  Dashboard
                </Link>
                <button 
                  onClick={onLogout}
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <p className="font-medium">Murdoch University</p>
                <p className="text-xs text-gray-400">Perth, Western Australia</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              <span>Academic Survey System</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
            <p>Travel Habits of International Students at Murdoch University</p>
            <p className="mt-1">© 2024 Murdoch University. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Page footer with A4 print styling */}
      <div className="bg-gray-100 py-2 px-4 text-center text-xs text-gray-500 border-t border-gray-200">
        Page <span className="font-mono">1</span> of <span className="font-mono">1</span>
      </div>
    </div>
  );
}
