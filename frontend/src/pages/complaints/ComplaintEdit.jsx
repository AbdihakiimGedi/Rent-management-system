import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { complaintApi } from '../../api/complaintApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const ComplaintEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { t } = useLanguage();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        complaint_type: '',
        description: ''
    });

    useEffect(() => {
        fetchComplaint();
    }, [id]);

    const fetchComplaint = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await complaintApi.getComplaint(id);
            const complaintData = response.complaint;

            // Check if complaint can be edited
            if (complaintData.status !== 'Pending') {
                setError('This complaint cannot be edited as it is no longer pending.');
                return;
            }

            setComplaint(complaintData);
            setFormData({
                complaint_type: complaintData.complaint_type,
                description: complaintData.description
            });
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    addNotification('Authentication failed. Please log in again.', 'error');
                    navigate('/login');
                } else if (status === 403) {
                    setError('You are not authorized to edit this complaint.');
                } else if (status === 404) {
                    setError('Complaint not found.');
                } else if (status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError('Error fetching complaint. Please try again.');
                }
            } else if (error.request) {
                setError('No response from server. Please check your internet connection.');
            } else {
                setError('Error fetching complaint. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.complaint_type || !formData.description.trim()) {
            addNotification('Please fill in all required fields.', 'error');
            return;
        }

        if (formData.description.trim().length < 10) {
            addNotification('Description must be at least 10 characters long.', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await complaintApi.updateComplaint(id, formData);
            addNotification('Complaint updated successfully!', 'success');
            navigate(`/complaints/${id}`);
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    addNotification('Authentication failed. Please log in again.', 'error');
                } else if (status === 403) {
                    addNotification('You are not authorized to update this complaint.', 'error');
                } else if (status === 404) {
                    addNotification('Complaint not found.', 'error');
                } else if (status === 400) {
                    addNotification('Cannot update resolved or rejected complaints.', 'error');
                } else if (status >= 500) {
                    addNotification('Server error. Please try again later.', 'error');
                } else {
                    addNotification('Error updating complaint. Please try again.', 'error');
                }
            } else if (error.request) {
                addNotification('No response from server. Please check your internet connection.', 'error');
            } else {
                addNotification('Error updating complaint. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cannot Edit Complaint</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => navigate('/complaints')}
                                className="bg-gray-500 hover:bg-gray-600 text-white"
                            >
                                Back to Complaints
                            </Button>
                            <Button
                                onClick={() => navigate(`/complaints/${id}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                View Complaint
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Complaint Not Found</h2>
                        <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist or has been removed.</p>
                        <Button
                            onClick={() => navigate('/complaints')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Back to Complaints
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Complaint</h1>
                        <p className="text-gray-600">Update your complaint details</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Editing Information</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>• You can only edit complaints that are still pending</p>
                                    <p>• Changes will be tracked and visible to administrators</p>
                                    <p>• Make sure your description is clear and detailed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="complaint_type" className="block text-sm font-medium text-gray-700 mb-2">
                                Complaint Type *
                            </label>
                            <select
                                id="complaint_type"
                                name="complaint_type"
                                value={formData.complaint_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                            >
                                <option value="">Select complaint type...</option>
                                <option value="Owner">Owner Issue</option>
                                <option value="Renter">Renter Issue</option>
                                <option value="Other">Other Issue</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                placeholder="Please describe the issue in detail..."
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Minimum 10 characters. Current: {formData.description.length} characters
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                onClick={() => navigate(`/complaints/${id}`)}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!formData.complaint_type || !formData.description.trim() || formData.description.trim().length < 10 || submitting}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Updating...' : 'Update Complaint'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ComplaintEdit;




