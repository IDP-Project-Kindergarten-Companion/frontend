// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, brandColors } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import MessageBox from '../components/ui/MessageBox';
import { UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'parent', email: '', first_name: '', last_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiRequest } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }
    try {
      await apiRequest('AUTH', '/register', 'POST', formData, false);
      setSuccess('Registration successful! Please login.');
      setFormData({ username: '', password: '', role: 'parent', email: '', first_name: '', last_name: '' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img 
            src={`https://placehold.co/56x56/${brandColors.background.substring(1)}/${brandColors.text.substring(1)}?text=LS`} 
            alt="Little Steps Logo" 
            className="mx-auto h-14 w-14 rounded-full" 
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-text">Create your account</h2>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <MessageBox message={error} type="error" onDismiss={() => setError('')} />
            <MessageBox message={success} type="success" onDismiss={() => setSuccess('')} />
            <InputField id="username" label="Username" name="username" value={formData.username} onChange={handleChange} required />
            <InputField id="email" label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <InputField id="first_name" label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            <InputField id="last_name" label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
            <InputField id="password" label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-brand-textLight mb-1">Role <span className="text-brand-error">*</span></label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="block w-full px-3 py-2 border border-brand-border bg-brand-surface text-brand-text rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm">
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <Button type="submit" fullWidth disabled={isLoading} iconLeft={<UserPlus size={18}/>}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-brand-textLight">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-medium text-brand-primary hover:text-brand-primaryHover">
              Sign in
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
