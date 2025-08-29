import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { complaintApi } from '../../api/complaintApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const ComplaintList = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintApi.getMyComplaints();

      // Ensure we always have an array, handle different response structures
      let complaintsData = [];
      if (response && Array.isArray(response)) {
        complaintsData = response;
      } else if (response && response.complaints && Array.isArray(response.complaints)) {
        complaintsData = response.complaints;
      } else if (response && response.data && Array.isArray(response.data)) {
        complaintsData = response.data;
      } else if (response && response.data && response.data.complaints && Array.isArray(response.data.complaints)) {
        complaintsData = response.data.complaints;
      }

      setComplaints(complaintsData);
      setTotalPages(1); // Non-admin users don't have pagination
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          addNotification('Authentication failed. Please log in again.', 'error');
        } else if (status === 403) {
          addNotification('You are not authorized to view complaints.', 'error');
        } else if (status === 404) {
          addNotification('Complaints endpoint not found.', 'error');
        } else if (status >= 500) {
          addNotification('Server error. Please try again later.', 'error');
        } else {
          addNotification('Error fetching complaints. Please try again.', 'error');
        }
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Error fetching complaints. Please try again.', 'error');
      }
      setComplaints([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchComplaints();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      await complaintApi.deleteComplaint(complaintId);
      addNotification('Complaint deleted successfully!', 'success');
      fetchComplaints(); // Refresh the list
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          addNotification('Authentication failed. Please log in again.', 'error');
        } else if (status === 403) {
          addNotification('You are not authorized to delete this complaint.', 'error');
        } else if (status === 404) {
          addNotification('Complaint not found.', 'error');
        } else if (status === 400) {
          addNotification('Cannot delete resolved or rejected complaints.', 'error');
        } else if (status >= 500) {
          addNotification('Server error. Please try again later.', 'error');
        } else {
          addNotification('Error deleting complaint. Please try again.', 'error');
        }
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Error deleting complaint. Please try again.', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Resolved': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeClasses = {
      'Owner': 'bg-blue-100 text-blue-800 border-blue-200',
      'Renter': 'bg-purple-100 text-purple-800 border-purple-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${typeClasses[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {type}
      </span>
    );
  };

  const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter(complaint => {
    const matchesSearch = !searchTerm ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complaint_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.status?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || complaint.status === statusFilter;
    const matchesType = !typeFilter || complaint.complaint_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">My Complaints</h1>
              <p className="text-gray-600">View and manage your submitted complaints</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button
                onClick={() => navigate('/complaints/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit New Complaint
              </Button>
              <Button
                onClick={fetchComplaints}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="Owner">Owner</option>
                  <option value="Renter">Renter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? 'Try adjusting your search criteria or filters.'
                  : 'You haven\'t submitted any complaints yet.'
                }
              </p>
              {!searchTerm && !statusFilter && !typeFilter && (
                <Button
                  onClick={() => navigate('/complaints/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit Your First Complaint
                </Button>
              )}
              {(searchTerm || statusFilter || typeFilter) && (
                <Button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <span className="text-sm text-gray-500">#{complaint.id}</span>
                      {getTypeBadge(complaint.complaint_type)}
                      {getStatusBadge(complaint.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Complaint Details</h3>
                    <p className="text-gray-700">{complaint.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Booking ID:</span>
                      <span className="ml-2 text-gray-600">#{complaint.booking_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Complainant:</span>
                      <span className="ml-2 text-gray-600">{complaint.complainant?.username || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Defendant:</span>
                      <span className="ml-2 text-gray-600">{complaint.defendant?.username || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(complaint.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {complaint.admin_notes && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-1">Admin Notes</h4>
                      <p className="text-blue-700 text-sm">{complaint.admin_notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => navigate(`/complaints/${complaint.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2"
                    >
                      View Details
                    </Button>

                    {complaint.status === 'Pending' && (
                      <>
                        <Button
                          onClick={() => navigate(`/complaints/${complaint.id}/edit`)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-2"
                        >
                          Edit
                        </Button>

                        <Button
                          onClick={() => handleDeleteComplaint(complaint.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintList;