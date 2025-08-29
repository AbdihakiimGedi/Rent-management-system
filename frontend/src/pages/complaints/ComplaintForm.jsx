import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { complaintApi } from '../../api/complaintApi';
import { bookingApi } from '../../api/bookingApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const ComplaintForm = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { t } = useLanguage();

  const [complaintData, setComplaintData] = useState({
    booking_id: '',
    complaint_type: '',
    description: ''
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getMyBookings();
      const userBookings = response.bookings || [];
      setBookings(userBookings);

      if (userBookings.length === 0) {
        addNotification('No bookings found. You need to have bookings to submit complaints.', 'info');
      }
    } catch (error) {
      addNotification('Error fetching bookings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setComplaintData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!complaintData.booking_id || !complaintData.complaint_type || !complaintData.description.trim()) {
      addNotification('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await complaintApi.submitComplaint(complaintData);
      addNotification('Complaint submitted successfully!', 'success');
      navigate('/complaints');
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          addNotification('Invalid complaint data. Please check your input.', 'error');
        } else if (status === 401) {
          addNotification('Authentication failed. Please log in again.', 'error');
        } else if (status === 403) {
          addNotification('You are not authorized to submit complaints.', 'error');
        } else if (status === 404) {
          addNotification('Booking not found or you are not involved in this booking.', 'error');
        } else if (status >= 500) {
          addNotification('Server error. Please try again later.', 'error');
        } else {
          addNotification('Error submitting complaint. Please try again.', 'error');
        }
      } else if (error.request) {
        addNotification('No response from server. Please check your internet connection.', 'error');
      } else {
        addNotification('Error submitting complaint. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = complaintData.booking_id && complaintData.complaint_type && complaintData.description.trim();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Submit a Complaint</h1>
            <p className="text-gray-600">Report an issue with a booking or rental item</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Select the specific booking you want to complain about</p>
                  <p>• Choose the appropriate complaint type</p>
                  <p>• Provide a detailed description of the issue</p>
                  <p>• Your complaint will be reviewed by our support team</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="booking_id" className="block text-sm font-medium text-gray-700 mb-2">
                Select Booking *
              </label>
              <select
                id="booking_id"
                name="booking_id"
                value={complaintData.booking_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Choose a booking...</option>
                {bookings.map((booking) => (
                  <option key={booking.booking_id} value={booking.booking_id}>
                    Booking #{booking.booking_id} - {booking.rental_item_name}
                    {booking.total_amount ? ` ($${booking.total_amount})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the booking you want to submit a complaint about
              </p>
            </div>

            <div>
              <label htmlFor="complaint_type" className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Type *
              </label>
              <select
                id="complaint_type"
                name="complaint_type"
                value={complaintData.complaint_type}
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
                value={complaintData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Please describe the issue in detail..."
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/complaints')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;