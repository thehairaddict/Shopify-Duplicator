import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, X, Download, Activity, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

export default function MigrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, subscribeMigration, unsubscribeMigration } = useSocket();
  
  const [migration, setMigration] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMigration();
    fetchLogs();
    
    if (socket) {
      subscribeMigration(id);
      
      socket.on(`migration:progress:${id}`, handleProgressUpdate);
      socket.on(`migration:log:${id}`, handleNewLog);
      socket.on(`migration:complete:${id}`, handleComplete);
      socket.on(`migration:error:${id}`, handleError);
    }

    return () => {
      if (socket) {
        unsubscribeMigration(id);
        socket.off(`migration:progress:${id}`);
        socket.off(`migration:log:${id}`);
        socket.off(`migration:complete:${id}`);
        socket.off(`migration:error:${id}`);
      }
    };
  }, [id, socket]);

  const fetchMigration = async () => {
    try {
      const response = await api.get(`/api/migrations/${id}`);
      setMigration(response.data.migration);
    } catch (error) {
      console.error('Failed to fetch migration:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/api/migrations/${id}/logs?limit=100`);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleProgressUpdate = (data) => {
    setMigration(prev => ({
      ...prev,
      progress: data.allProgress,
      processed_items: data.allProcessed,
      total_items: data.allTotals,
    }));
  };

  const handleNewLog = (log) => {
    setLogs(prev => [log, ...prev]);
  };

  const handleComplete = () => {
    fetchMigration();
  };

  const handleError = (error) => {
    console.error('Migration error:', error);
    fetchMigration();
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.put(`/api/migrations/${id}/pause`);
      fetchMigration();
    } catch (error) {
      alert('Failed to pause migration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.put(`/api/migrations/${id}/resume`);
      fetchMigration();
    } catch (error) {
      alert('Failed to resume migration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this migration?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/migrations/${id}/cancel`);
      fetchMigration();
    } catch (error) {
      alert('Failed to cancel migration');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await api.get(`/api/migrations/${id}/export`, {
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
        return <CheckCircle size={24} />;
      case 'running':
        return <Activity size={24} className="animate-pulse" />;
      case 'failed':
        return <XCircle size={24} />;
      default:
        return <Clock size={24} />;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10';
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10';
      default:
        return 'text-blue-600 dark:text-cyber-cyan bg-blue-50 dark:bg-cyber-cyan/10';
    }
  };

  const calculateGlobalProgress = () => {
    if (!migration?.progress || !migration?.selected_modules) return 0;
    
    const selectedModules = Object.keys(migration.selected_modules).filter(
      key => migration.selected_modules[key]
    );
    
    if (selectedModules.length === 0) return 0;
    
    const totalProgress = selectedModules.reduce((sum, module) => {
      return sum + (migration.progress[module] || 0);
    }, 0);
    
    return Math.round(totalProgress / selectedModules.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyber-cyan"></div>
      </div>
    );
  }

  if (!migration) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Migration not found</p>
      </div>
    );
  }

  const globalProgress = calculateGlobalProgress();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/migrations')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Migrations</span>
        </button>

        <div className="flex items-center space-x-3">
          {migration.status === 'running' && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-all disabled:opacity-50"
            >
              <Pause size={18} />
              <span>Pause</span>
            </button>
          )}

          {migration.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-all disabled:opacity-50"
            >
              <Play size={18} />
              <span>Resume</span>
            </button>
          )}

          {['running', 'paused', 'pending'].includes(migration.status) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-all disabled:opacity-50"
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
          )}

          {migration.status === 'completed' && (
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-cyber-cyan/20 dark:text-cyber-cyan rounded-lg hover:bg-blue-200 dark:hover:bg-cyber-cyan/30 transition-all"
            >
              <Download size={18} />
              <span>Download Report</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(migration.status)}`}>
                {getStatusIcon(migration.status)}
                <span className="capitalize">{migration.status}</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {migration.source_store_name} → {migration.destination_store_name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Started: {new Date(migration.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{globalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${globalProgress}%` }}
            >
              {globalProgress > 10 && (
                <span className="text-xs text-white font-medium">{globalProgress}%</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {migration.selected_modules && Object.entries(migration.selected_modules).map(([module, selected]) => {
            if (!selected) return null;
            
            const progress = migration.progress?.[module] || 0;
            const processed = migration.processed_items?.[module] || 0;
            const total = migration.total_items?.[module] || 0;

            return (
              <div key={module} className="p-4 bg-gray-50 dark:bg-cyber-dark rounded-lg border border-gray-200 dark:border-cyber-cyan/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{module}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 dark:bg-cyber-cyan h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {processed} / {total} items
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 border dark:border-cyber-cyan/30">
        <div className="p-6 border-b border-gray-200 dark:border-cyber-cyan/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Logs</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">No logs yet</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${getLogLevelColor(log.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold capitalize">[{log.module}]</span>
                        <span className="text-xs opacity-75">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p>{log.message}</p>
                    </div>
                    {log.level === 'error' && <AlertCircle size={16} className="flex-shrink-0 ml-2" />}
                    {log.level === 'success' && <CheckCircle size={16} className="flex-shrink-0 ml-2" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {migration.errors && migration.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500/30 p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-4">Errors</h2>
          <div className="space-y-2">
            {migration.errors.map((error, index) => (
              <div key={index} className="p-3 bg-white dark:bg-cyber-darker rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error.error}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {error.module} - {new Date(error.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
