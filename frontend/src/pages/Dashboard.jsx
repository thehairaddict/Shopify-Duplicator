import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, GitBranch, Plus, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    stores: 0,
    migrations: 0,
    running: 0,
    completed: 0,
  });
  const [recentMigrations, setRecentMigrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [storesRes, migrationsRes] = await Promise.all([
        api.get('/api/stores'),
        api.get('/api/migrations'),
      ]);

      const migrations = migrationsRes.data.migrations;
      setStats({
        stores: storesRes.data.stores.length,
        migrations: migrations.length,
        running: migrations.filter(m => m.status === 'running').length,
        completed: migrations.filter(m => m.status === 'completed').length,
      });

      setRecentMigrations(migrations.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'running':
        return 'text-blue-600 dark:text-cyber-cyan bg-blue-100 dark:bg-cyber-cyan/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'paused':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'running':
        return <Activity size={16} className="animate-pulse" />;
      case 'failed':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyber-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your Shopify store migrations
          </p>
        </div>
        <Link
          to="/migrations/new"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple text-white rounded-lg hover:shadow-lg dark:hover:shadow-cyber-cyan/50 transition-all dark:animate-glow"
        >
          <Plus size={20} />
          <span>New Migration</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Stores</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.stores}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-cyber-cyan/20 rounded-lg flex items-center justify-center">
              <Database className="text-blue-600 dark:text-cyber-cyan" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Migrations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.migrations}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-cyber-purple/20 rounded-lg flex items-center justify-center">
              <GitBranch className="text-purple-600 dark:text-cyber-purple" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.running}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-cyber-cyan/20 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-600 dark:text-cyber-cyan animate-pulse" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 border dark:border-cyber-cyan/30">
        <div className="p-6 border-b border-gray-200 dark:border-cyber-cyan/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Migrations</h2>
        </div>
        <div className="p-6">
          {recentMigrations.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">No migrations yet</p>
              <Link
                to="/migrations/new"
                className="inline-block mt-4 text-blue-600 dark:text-cyber-cyan hover:underline"
              >
                Start your first migration
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMigrations.map((migration) => (
                <Link
                  key={migration.id}
                  to={`/migrations/${migration.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-cyber-cyan/30 hover:bg-gray-50 dark:hover:bg-cyber-dark transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(migration.status)}`}>
                          {getStatusIcon(migration.status)}
                          <span className="capitalize">{migration.status}</span>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(migration.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mt-2">
                        <span className="font-medium">{migration.source_store_name}</span>
                        {' → '}
                        <span className="font-medium">{migration.destination_store_name}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
