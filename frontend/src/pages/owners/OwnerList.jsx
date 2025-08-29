import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const OwnerList = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [searchLoading, setSearchLoading] = useState(false);

  const { addNotification } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwners();
  }, []); // Only run on mount

  // Separate effect for search and pagination
  useEffect(() => {
    if (!loading) { // Only fetch if not already loading
      fetchOwners();
    }
  }, [currentPage, statusFilter]);

  // Effect for search term changes
  useEffect(() => {
    if (searchTerm !== '') {
      // Reset to first page when searching
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: perPage,
        role: 'owner', // Only fetch owners
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      };

      const response = await adminApi.getUsers(params);

      // Extract the actual data from Axios response
      const responseData = response.data || response;

      if (responseData && responseData.users) {
        setOwners(responseData.users);
        setTotalPages(responseData.total_pages || 1);
      } else {
        setOwners([]);
        setTotalPages(1);
      }
    } catch (error) {
      if (error.response) {
        addNotification(`Failed to fetch owners: ${error.response.data?.error || 'Unknown error'}`, 'error');
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Failed to fetch owners. Please try again.', 'error');
      }
      setOwners([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      setSearchTerm('');
      setCurrentPage(1);
      fetchOwners();
      return;
    }

    try {
      setSearchLoading(true);
      setCurrentPage(1);
      await fetchOwners();
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/owners/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/owners/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this owner? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.deleteUser(id);
      addNotification('Owner deleted successfully', 'success');
      fetchOwners(); // Refresh the list
    } catch (error) {
      console.error('Error deleting owner:', error);
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          addNotification('Cannot delete this owner account', 'error');
        } else if (status === 403) {
          addNotification('You are not authorized to delete this owner', 'error');
        } else if (status >= 500) {
          addNotification('Server error. Please try again later.', 'error');
        } else {
          addNotification('Error deleting owner. Please try again.', 'error');
        }
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Error deleting owner. Please try again.', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRestriction = async (id, currentRestriction) => {
    try {
      setActionLoading(true);
      await adminApi.toggleUserRestriction(id, !currentRestriction);
      addNotification(
        `Owner ${!currentRestriction ? 'restricted' : 'unrestricted'} successfully`,
        'success'
      );
      fetchOwners(); // Refresh the list
    } catch (error) {
      console.error('Error toggling restriction:', error);
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          addNotification('Cannot restrict this owner account', 'error');
        } else if (status >= 500) {
          addNotification('Server error. Please try again later.', 'error');
        } else {
          addNotification('Error updating restriction. Please try again.', 'error');
        }
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Error updating restriction. Please try again.', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      setActionLoading(true);
      await adminApi.updateUser(id, { is_active: !currentActive });
      addNotification(
        `Owner ${!currentActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
      fetchOwners(); // Refresh the list
    } catch (error) {
      console.error('Error toggling active status:', error);
      addNotification('Error updating owner status. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isActive, isRestricted) => {
    if (isRestricted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          Restricted
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Loading owners...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Owner Management</h1>
              <p className="text-gray-600">Manage all owner accounts in the system</p>
              {owners.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Found {owners.length} owner{owners.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchTerm('');
                  setStatusFilter('all');
                  fetchOwners();
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Refresh
              </Button>
              <Button
                onClick={() => navigate('/admin/users')}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                View All Users
              </Button>
              <Button
                onClick={() => navigate('/admin/owner-requests')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Owner Requests
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Owners
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, username, email..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                  >
                    {searchLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Search
                      </div>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="restricted">Restricted Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCurrentPage(1);
                    fetchOwners();
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Owners Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Owner Accounts ({owners.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Since
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {owners.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Owners Found</h3>
                        <p className="text-gray-500 mb-6">
                          {searchTerm || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'There are no owner accounts in the system yet.'}
                        </p>
                        {searchTerm || statusFilter !== 'all' ? (
                          <Button
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                              setCurrentPage(1);
                              fetchOwners();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Clear Filters
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">
                              This could mean:
                            </p>
                            <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                              <li>No users have been promoted to owner role yet</li>
                              <li>All owner accounts have been deleted</li>
                              <li>There's an issue with the database connection</li>
                            </ul>
                            <div className="pt-2">
                              <Button
                                onClick={() => navigate('/admin/users')}
                                className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                              >
                                View All Users
                              </Button>
                              <Button
                                onClick={() => navigate('/admin/owner-requests')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Check Owner Requests
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    owners.map((owner) => (
                      <tr key={owner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {owner.full_name?.charAt(0) || owner.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {owner.full_name || 'No Name'}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{owner.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {owner.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {owner.phone_number || 'No phone'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(owner.is_active, owner.is_restricted)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {owner.created_at ? new Date(owner.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleViewDetails(owner.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                            >
                              View
                            </Button>

                            <Button
                              onClick={() => handleEdit(owner.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1"
                            >
                              Edit
                            </Button>

                            <Button
                              onClick={() => handleToggleActive(owner.id, owner.is_active)}
                              disabled={actionLoading}
                              className={`text-xs px-3 py-1 ${owner.is_active
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                              {owner.is_active ? 'Deactivate' : 'Activate'}
                            </Button>

                            <Button
                              onClick={() => handleToggleRestriction(owner.id, owner.is_restricted)}
                              disabled={actionLoading}
                              className={`text-xs px-3 py-1 ${owner.is_restricted
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                            >
                              {owner.is_restricted ? 'Unrestrict' : 'Restrict'}
                            </Button>

                            <Button
                              onClick={() => handleDelete(owner.id)}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerList;