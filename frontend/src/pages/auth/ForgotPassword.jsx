import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Toast from '../../components/Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <InputField
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="mt-4">Send Reset Link</Button>
      </form>
      {message && <Toast message={message} type="success" />}
      {error && <Toast message={error} type="error" />}
      <div className="mt-4">
        <button onClick={() => navigate('/login')} className="text-blue-500">Back to Login</button>
      </div>
    </div>
  );
};

export default ForgotPassword;