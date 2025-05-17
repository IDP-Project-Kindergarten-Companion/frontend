// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, brandColors } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../../components/ui/Button'; // Adjusted path
import Card from '../../components/ui/Card'; // Adjusted path
import InputField from '../../components/ui/InputField'; // Adjusted path
import MessageBox from '../../components/ui/MessageBox'; // Adjusted path
import { User, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard'); // Navigate to dashboard on successful login
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img 
            src={`https://placehold.co/64x64/${brandColors.background.substring(1)}/${brandColors.text.substring(1)}?text=LS`} 
            alt="Little Steps Logo" 
            className="mx-auto h-16 w-16 rounded-full" 
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-text">
            Sign in to Little Steps
          </h2>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <MessageBox message={error} type="error" onDismiss={() => setError('')} />
            <InputField
              id="username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              icon={<User />}
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              icon={<LogIn className="transform rotate-90"/>}
            />
            <div>
              <Button type="submit" fullWidth disabled={isLoading} iconLeft={<LogIn size={18}/>}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-brand-textLight">
            Not a member?{' '}
            <button onClick={() => navigate('/register')} className="font-medium text-brand-primary hover:text-brand-primaryHover">
              Register here
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
