import { useState, useEffect } from 'react';
import { Plus, Database, Trash2, Edit2, CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../services/api';

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    storeType: 'source',
  });
  const [testingConnection, setTestingConnection] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.stores);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, formData);
      } else {
        await api.post('/stores', formData);
      }
      setShowModal(false);
      setEditingStore(null);
      resetForm();
      fetchStores();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save store');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this store?')) return;
    try {
      await api.delete(`/stores/${id}`);
      fetchStores();
    } catch (error) {
      alert('Failed to delete store');
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      storeUrl: store.store_url,
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      storeType: store.store_type,
    });
    setShowModal(true);
  };

  const testConnection = async (id) => {
    setTestingConnection(id);
    try {
      const response = await api.post(`/stores/${id}/test`);
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || 'Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      storeUrl: '',
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      storeType: 'source',
    });
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Shopify store credentials
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingStore(null); resetForm(); }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple text-white rounded-lg hover:shadow-lg dark:hover:shadow-cyber-cyan/50 transition-all"
        >
          <Plus size={20} />
          <span>Add Store</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white dark:bg-cyber-darker rounded-xl shadow-lg dark:shadow-cyber-cyan/10 p-6 border dark:border-cyber-cyan/30"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-cyber-cyan/20 rounded-lg flex items-center justify-center">
                  <Database className="text-blue-600 dark:text-cyber-cyan" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{store.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    store.store_type === 'source'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {store.store_type}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate">
              {store.store_url}
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => testConnection(store.id)}
                disabled={testingConnection === store.id}
                className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 dark:bg-cyber-cyan/20 dark:text-cyber-cyan rounded-lg hover:bg-blue-200 dark:hover:bg-cyber-cyan/30 transition-all text-sm font-medium disabled:opacity-50"
              >
                {testingConnection === store.id ? (
                  <Loader className="animate-spin mx-auto" size={16} />
                ) : (
                  'Test'
                )}
              </button>
              <button
                onClick={() => handleEdit(store)}
                className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(store.id)}
                className="p-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-cyber-darker rounded-xl border dark:border-cyber-cyan/30">
          <Database className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">No stores configured yet</p>
          <button
            onClick={() => { setShowModal(true); resetForm(); }}
            className="mt-4 text-blue-600 dark:text-cyber-cyan hover:underline"
          >
            Add your first store
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-cyber-darker rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border dark:border-cyber-cyan/30">
            <div className="p-6 border-b border-gray-200 dark:border-cyber-cyan/20">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingStore ? 'Edit Store' : 'Add Store'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                  placeholder="My Shopify Store"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store URL
                </label>
                <input
                  type="text"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                  placeholder="mystore.myshopify.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                  placeholder={editingStore ? 'Leave blank to keep current' : 'API Key'}
                  required={!editingStore}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Secret
                </label>
                <input
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                  placeholder={editingStore ? 'Leave blank to keep current' : 'API Secret'}
                  required={!editingStore}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                  placeholder={editingStore ? 'Leave blank to keep current' : 'Access Token'}
                  required={!editingStore}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Type
                </label>
                <select
                  value={formData.storeType}
                  onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyber-cyan dark:bg-cyber-dark dark:text-white"
                  required
                >
                  <option value="source">Source</option>
                  <option value="destination">Destination</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingStore(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-cyber-cyan/30 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-cyber-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-cyber-cyan dark:to-cyber-purple text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingStore ? 'Update' : 'Add'} Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
