import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut, Home, Database, GitBranch, Mail, Phone } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Stores', href: '/stores', icon: Database },
    { name: 'Migrations', href: '/migrations', icon: GitBranch },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cyber-dark transition-colors">
      <nav className="bg-white dark:bg-cyber-darker border-b border-gray-200 dark:border-cyber-cyan/20 shadow-lg dark:shadow-cyber-cyan/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Z</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white glow-text dark:text-cyber-cyan">
                  Zenith Weave
                </span>
              </Link>

              <div className="hidden md:flex space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        active
                          ? 'bg-blue-100 text-blue-700 dark:bg-cyber-cyan/20 dark:text-cyber-cyan glow-border dark:border dark:border-cyber-cyan'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-cyber-darker dark:hover:text-cyber-cyan'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-cyber-darker dark:hover:bg-cyber-cyan/20 transition-all dark:border dark:border-cyber-cyan/30"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-gray-700 dark:text-cyber-cyan" />
                ) : (
                  <Sun size={20} className="text-cyber-cyan animate-pulse" />
                )}
              </button>

              <div className="text-sm text-gray-700 dark:text-gray-300">
                {user?.email}
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-all dark:border dark:border-red-500/30"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-cyber-darker border-t border-gray-200 dark:border-cyber-cyan/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-lg font-bold text-gray-900 dark:text-cyber-cyan glow-text">
                Zenith Weave
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shopify Store Duplicator
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-2">
              <a
                href="mailto:hi@zenithweave.com"
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyber-cyan transition-colors"
              >
                <Mail size={16} />
                <span>hi@zenithweave.com</span>
              </a>
              <a
                href="tel:+201011400020"
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyber-cyan transition-colors"
              >
                <Phone size={16} />
                <span>+201011400020</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-cyber-cyan/20 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} Zenith Weave. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
