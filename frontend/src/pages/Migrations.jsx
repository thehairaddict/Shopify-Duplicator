import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GitBranch, CheckCircle, XCircle, Activity, Clock, Download } from 'lucide-react';
import api from '../services/api';

export default function Migrations() {
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMigrations();
  }, []);

  const fetchMigrations = async () => {
    try {
      const response = await api.get('/migrations');
      setMigrations(response.data.migrations);
    } catch (error) {
      console.error('Failed to fetch migrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-500/30';
      case 'running':
        return 'text-blue-600 dark:text-cyber-cyan bg-blue-100 dark:bg-cyber-cyan/20 border-blue-200 dark:border-cyber-cyan/30';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-500/30';
      case 'paused':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} />;
      case 'running':
        return <Activity size={20} className="animate-pulse" />;
      case 'failed':
        return <XCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const downloadReport = async (id) => {
    try {
      const response = await api.get(`/migrations/${id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `migration-${id}-report.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download report');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Migrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your store migrations
          </p>
        </div>
        <Link
          to="/migrations/new"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple text-white rounded-lg hover:shadow-lg dark:hover:shadow-cyber-cyan/50 transition-all"
        >
          <Plus size={20} />
          <span>New Migration</span>
        </Link>
      </div>

      {migrations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-cyber-darker rounded-xl border dark:border-cyber-cyan/30">
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
          {migrations.map((migration) => (
            <div
              key={migration.id}
              className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 border ${getStatusColor(migration.status)}`}>
                      {getStatusIcon(migration.status)}
                      <span className="capitalize">{migration.status}</span>
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(migration.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-lg text-gray-900 dark:text-white">
                      <span className="font-semibold">{migration.source_store_name}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-semibold">{migration.destination_store_name}</span>
                    </p>
                  </div>

                  {migration.progress && Object.keys(migration.progress).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(migration.progress).map(([module, progress]) => (
                        <div key={module} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{module}:</span>
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 dark:bg-cyber-cyan h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium">{progress}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {migration.status === 'completed' && (
                    <button
                      onClick={() => downloadReport(migration.id)}
                      className="p-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-all"
                      title="Download Report"
                    >
                      <Download size={20} />
                    </button>
                  )}
                  <Link
                    to={`/migrations/${migration.id}`}
                    className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-cyber-cyan/20 dark:text-cyber-cyan rounded-lg hover:bg-blue-200 dark:hover:bg-cyber-cyan/30 transition-all font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
