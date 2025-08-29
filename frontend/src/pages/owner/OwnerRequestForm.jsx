import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const OwnerRequestForm = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState([]);
  const [formData, setFormData] = useState({
    requirements_data: {}
  });
  const [loading, setLoading] = useState(false);
  const [requirementsLoading, setRequirementsLoading] = useState(true);
  const [existingRequest, setExistingRequest] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user && user.role === 'user') {
      console.log('✅ User authenticated, fetching requirements...');
      fetchRequirements();
      // Check for existing request after requirements are loaded
      setTimeout(() => {
        checkExistingRequest();
      }, 1000);
    }
  }, [user]);

  const fetchRequirements = async () => {
    try {
      setRequirementsLoading(true);
      console.log('🔍 Fetching owner requirements...');

      const response = await ownerApi.getOwnerRequirements();
      console.log('📡 Full API response:', response);
      console.log('📡 Response type:', typeof response);
      console.log('📡 Response keys:', Object.keys(response));

      // Axios response has data property
      const requirementsList = response.data?.requirements || [];
      console.log('📋 Requirements list:', requirementsList);
      console.log('📋 Requirements count:', requirementsList.length);

      setRequirements(requirementsList);

      // Initialize form data with appropriate default values for each requirement type
      const initialData = {};
      requirementsList.forEach(req => {
        if (req.input_type === 'contract') {
          initialData[req.field_name] = false; // Contract acceptance starts as unchecked
        } else if (req.input_type === 'number') {
          initialData[req.field_name] = ''; // Numbers start as empty string
        } else {
          initialData[req.field_name] = ''; // Text, file, etc. start as empty string
        }
      });

      setFormData(prev => ({
        ...prev,
        requirements_data: initialData
      }));
    } catch (error) {
      console.error('Error fetching requirements:', error);
      addNotification('Error fetching requirements. Please try again.', 'error');
    } finally {
      setRequirementsLoading(false);
    }
  };

  const checkExistingRequest = async () => {
    try {
      const response = await ownerApi.getOwnerRequest();
      if (response.request) {
        setExistingRequest(response.request);
      }
    } catch (error) {
      // No existing request, which is fine
    }
  };

  // Role-based access control - only users (renters) can submit owner requests
  if (user.role !== 'user') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              {user.role === 'admin'
                ? 'Admins cannot submit owner requests.'
                : 'Owners cannot submit owner requests.'}
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user already has any request (pending, approved, or rejected), show status
  if (existingRequest) {
    const getStatusColor = (status) => {
      switch (status) {
        case 'Pending': return 'text-yellow-500';
        case 'Approved': return 'text-green-500';
        case 'Rejected': return 'text-red-500';
        default: return 'text-gray-500';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Pending':
          return (
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'Approved':
          return (
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'Rejected':
          return (
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        default:
          return (
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
    };

    const getStatusMessage = (status) => {
      switch (status) {
        case 'Pending':
          return 'You already have a pending owner request. Please wait for admin approval.';
        case 'Approved':
          return 'Congratulations! Your owner request has been approved. You can now create and manage rental items.';
        case 'Rejected':
          return 'Your owner request was not approved. You can submit a new request if you wish.';
        default:
          return 'You have an existing owner request.';
      }
    };

    const getStatusBgColor = (status) => {
      switch (status) {
        case 'Pending': return 'bg-yellow-50 border-yellow-200';
        case 'Approved': return 'bg-green-50 border-green-200';
        case 'Rejected': return 'bg-red-50 border-red-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    };

    const getStatusTextColor = (status) => {
      switch (status) {
        case 'Pending': return 'text-yellow-800';
        case 'Approved': return 'text-green-800';
        case 'Rejected': return 'text-red-800';
        default: return 'text-gray-800';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className={`mb-4 ${getStatusColor(existingRequest.status)}`}>
              {getStatusIcon(existingRequest.status)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {existingRequest.status === 'Pending' ? 'Request Already Submitted' :
                existingRequest.status === 'Approved' ? 'Request Approved!' :
                  existingRequest.status === 'Rejected' ? 'Request Not Approved' : 'Request Status'}
            </h2>
            <p className="text-gray-600 mb-6">
              {getStatusMessage(existingRequest.status)}
            </p>
            <div className={`border rounded-lg p-4 mb-6 ${getStatusBgColor(existingRequest.status)}`}>
              <div className={`text-sm ${getStatusTextColor(existingRequest.status)}`}>
                <p><strong>Status:</strong> {existingRequest.status}</p>
                <p><strong>Submitted:</strong> {new Date(existingRequest.submitted_at).toLocaleDateString()}</p>
                {existingRequest.approved_at && (
                  <p><strong>Processed:</strong> {new Date(existingRequest.approved_at).toLocaleDateString()}</p>
                )}
                {existingRequest.rejection_reason && (
                  <p><strong>Reason:</strong> {existingRequest.rejection_reason}</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show success message after submission
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-green-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your owner request has been submitted successfully. Admin will review and respond to your request as soon as possible.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800">
                <p><strong>Status:</strong> Pending Review</p>
                <p><strong>Submitted:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Next Step:</strong> Wait for admin approval</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-800">
                <p><strong>What happens next?</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>• Admin will review your application</li>
                  <li>• You'll be notified of the decision</li>
                  <li>• If approved, you'll gain owner privileges</li>
                  <li>• You can check status in your dashboard</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to dashboard in 5 seconds...
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Dashboard Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements_data: {
        ...prev.requirements_data,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = [];
    requirements.forEach(req => {
      if (req.is_required) {
        const value = formData.requirements_data[req.field_name];
        let isValid = false;

        if (req.input_type === 'contract') {
          // Contract must be explicitly accepted (true)
          isValid = value === true;
        } else if (req.input_type === 'file') {
          // File must be selected
          isValid = value && value instanceof File;
        } else if (req.input_type === 'number') {
          // Number must be provided and not empty
          isValid = value !== null && value !== undefined && value.toString().trim() !== '';
        } else {
          // Text fields must have content
          isValid = value && value.toString().trim() !== '';
        }

        if (!isValid) {
          missingFields.push(req.label);
        }
      }
    });

    if (missingFields.length > 0) {
      addNotification(`Please fill in required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await ownerApi.submitOwnerRequest(formData);
      addNotification('Owner request submitted successfully! Admin will review and respond to your request as soon as possible.', 'success');

      // Show success state
      setSubmissionSuccess(true);

      // Dispatch event to update other components
      window.dispatchEvent(new Event('ownerRequestUpdated'));

      // Don't navigate immediately, let user see the success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    } catch (error) {
      console.error('Error submitting owner request:', error);
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          addNotification('Please check your form data and try again.', 'error');
        } else if (status === 403) {
          addNotification('You are not authorized to submit owner requests.', 'error');
        } else if (status >= 500) {
          addNotification('Server error. Please try again later.', 'error');
        } else {
          addNotification('Error submitting owner request. Please try again.', 'error');
        }
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Error submitting owner request. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (requirementsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Loading owner requirements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-blue-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Become an Owner</h1>
            <p className="text-gray-600">Fill out the form below to request owner privileges</p>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• As an owner, you can create and manage rental items</p>
                  <p>• Your request will be reviewed by administrators</p>
                  <p>• You will be notified once your request is approved or rejected</p>
                  <p>• Make sure all required fields are filled accurately</p>
                </div>
              </div>
            </div>
          </div>

          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Requirements Defined</h3>
              <p className="text-gray-500 mb-6">
                No owner requirements have been defined yet. Please contact an administrator.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {requirements.map((requirement, index) => (
                <div key={requirement.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <label className="block text-lg font-semibold text-gray-800 mb-2">
                        {requirement.label}
                        {requirement.is_required && <span className="text-red-500 ml-2">*</span>}
                      </label>

                      {requirement.help_text && (
                        <p className="text-sm text-gray-600 mb-3">
                          {requirement.help_text}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {requirement.input_type}
                      </span>
                    </div>
                  </div>

                  {requirement.input_type === 'textarea' && (
                    <textarea
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      required={requirement.is_required}
                      rows={4}
                      placeholder={requirement.placeholder || `Enter ${requirement.label.toLowerCase()}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                  )}

                  {requirement.input_type === 'text' && (
                    <input
                      type="text"
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      required={requirement.is_required}
                      placeholder={requirement.placeholder || `Enter ${requirement.label.toLowerCase()}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  )}

                  {requirement.input_type === 'number' && (
                    <input
                      type="number"
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      required={requirement.is_required}
                      min="0"
                      step="0.01"
                      placeholder={requirement.placeholder || `Enter ${requirement.label.toLowerCase()}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  )}

                  {requirement.input_type === 'dropdown' && (
                    <select
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      required={requirement.is_required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select an option</option>
                      {requirement.options && requirement.options.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {requirement.input_type === 'email' && (
                    <input
                      type="email"
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      required={requirement.is_required}
                      placeholder={requirement.placeholder || `Enter ${requirement.label.toLowerCase()}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  )}

                  {requirement.input_type === 'phone' && (
                    <input
                      type="tel"
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      placeholder={requirement.placeholder || `Enter ${requirement.label.toLowerCase()}...`}
                      required={requirement.is_required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  )}

                  {requirement.input_type === 'date' && (
                    <input
                      type="date"
                      name={requirement.field_name}
                      value={formData.requirements_data[requirement.field_name] || ''}
                      onChange={(e) => handleChange(requirement.field_name, e.target.value)}
                      required={requirement.is_required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  )}

                  {requirement.input_type === 'file' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        name={requirement.field_name}
                        onChange={(e) => handleChange(requirement.field_name, e.target.files[0])}
                        required={requirement.is_required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max size: 5MB)
                      </p>
                    </div>
                  )}

                  {requirement.input_type === 'contract' && (
                    <div className="space-y-4">
                      {/* Contract Terms Display */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Contract Terms & Conditions
                          </h4>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {requirement.help_text || 'No contract terms defined'}
                          </div>
                        </div>
                      </div>

                      {/* Acceptance Checkbox */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name={requirement.field_name}
                          checked={formData.requirements_data[requirement.field_name] === true}
                          onChange={(e) => handleChange(requirement.field_name, e.target.checked)}
                          required={requirement.is_required}
                          className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700">
                            I have read and agree to the terms and conditions above
                          </label>
                          {requirement.is_required && (
                            <p className="text-xs text-red-500 mt-1">
                              You must accept the contract terms to continue
                            </p>
                          )}
                          {!formData.requirements_data[requirement.field_name] && requirement.is_required && (
                            <p className="text-xs text-red-500 mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              ⚠️ You must accept the contract terms to continue
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-8 py-3"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Owner Request'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerRequestForm;


