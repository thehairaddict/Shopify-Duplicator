import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Database, Package, Folder, FileText, Image, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function NewMigration() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    sourceStoreId: '',
    destinationStoreId: '',
    selectedModules: {
      theme: false,
      products: false,
      collections: false,
      pages: false,
      media: false,
    },
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.stores);
    } catch (error) {
      setError('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const sourceStores = stores.filter(s => s.store_type === 'source');
  const destinationStores = stores.filter(s => s.store_type === 'destination');

  const handleModuleToggle = (module) => {
    setFormData({
      ...formData,
      selectedModules: {
        ...formData.selectedModules,
        [module]: !formData.selectedModules[module],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!Object.values(formData.selectedModules).some(v => v)) {
      setError('Please select at least one module to migrate');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/migrations/start', formData);
      navigate(`/migrations/${response.data.migration.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start migration');
    } finally {
      setSubmitting(false);
    }
  };

  const modules = [
    { id: 'theme', name: 'Theme', icon: Folder, description: 'Active theme with all customizations' },
    { id: 'products', name: 'Products', icon: Package, description: 'Products, variants, images, and metafields' },
    { id: 'collections', name: 'Collections', icon: Database, description: 'Smart & manual collections with rules' },
    { id: 'pages', name: 'Pages', icon: FileText, description: 'Page content and templates' },
    { id: 'media', name: 'Media Files', icon: Image, description: 'All uploaded media files' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyber-cyan"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Migration</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure and start a new store migration
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg flex items-start space-x-2">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Stores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Store
              </label>
              <select
                value={formData.sourceStoreId}
                onChange={(e) => setFormData({ ...formData, sourceStoreId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                required
              >
                <option value="">Select source store</option>
                {sourceStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.store_url})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination Store
              </label>
              <select
                value={formData.destinationStoreId}
                onChange={(e) => setFormData({ ...formData, destinationStoreId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                required
              >
                <option value="">Select destination store</option>
                {destinationStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.store_url})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sourceStores.length === 0 || destinationStores.length === 0 ? (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                You need at least one source store and one destination store to create a migration.
                <a href="/stores" className="ml-1 underline font-medium">Add stores</a>
              </p>
            </div>
          ) : null}
        </div>

        <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Modules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const isSelected = formData.selectedModules[module.id];
              
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => handleModuleToggle(module.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 dark:border-cyber-cyan bg-blue-50 dark:bg-cyber-cyan/10'
                      : 'border-gray-200 dark:border-cyber-cyan/30 hover:border-gray-300 dark:hover:border-cyber-cyan/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-500 dark:bg-cyber-cyan'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <Icon className={isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'} size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{module.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{module.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/migrations')}
            className="px-6 py-3 border border-gray-300 dark:border-cyber-cyan/30 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-cyber-dark transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || sourceStores.length === 0 || destinationStores.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple text-white rounded-lg hover:shadow-lg dark:hover:shadow-cyber-cyan/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{submitting ? 'Starting...' : 'Start Migration'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
