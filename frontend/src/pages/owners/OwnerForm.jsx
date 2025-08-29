import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';
import InputField from '../../components/InputField';
import Button from '../../components/Button';

const OwnerForm = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    birthdate: '',
    username: '',
    password: '',
    role: 'owner'
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isEditing) {
      fetchOwner();
    }
    fetchCategories();
  }, [id]);

  const fetchOwner = async () => {
    try {
      const response = await adminApi.getUser(id);
      setFormData(response.data);
    } catch (error) {
      addNotification('Error fetching owner data', 'error');
      navigate('/owners');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    setLoading(true);

    try {
      if (isEditing) {
        await adminApi.updateUser(id, formData);
        addNotification('Owner updated successfully', 'success');
      } else {
        await adminApi.createUser(formData);
        addNotification('Owner created successfully', 'success');
      }
      navigate('/owners');
    } catch (error) {
      addNotification(
        error.response?.data?.error || 'Error saving owner',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Owner' : 'Add New Owner'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isEditing ? 'Update owner information' : 'Create a new owner account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <InputField
            label="Full Name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            maxLength={100}
          />

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleInputChange}
            required
            maxLength={9}
          />

          {/* Email */}
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            maxLength={120}
          />

          {/* Address */}
          <InputField
            label="Address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            required
            maxLength={200}
          />

          {/* Birthdate */}
          <InputField
            label="Birthdate"
            name="birthdate"
            type="date"
            value={formData.birthdate}
            onChange={handleInputChange}
            required
          />

          {/* Username */}
          <InputField
            label="Username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            required
            maxLength={50}
          />

          {/* Password */}
          <InputField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            maxLength={100}
          />

          {/* Role */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.role === 'owner'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  role: e.target.checked ? 'owner' : 'user'
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Grant owner privileges
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/owners')}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {isEditing ? t('update') : t('create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerForm;