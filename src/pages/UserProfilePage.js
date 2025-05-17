// src/pages/UserProfilePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../../components/ui/Button'; // Adjusted path
import Card from '../../components/ui/Card'; // Adjusted path
import InputField from '../../components/ui/InputField'; // Adjusted path
import MessageBox from '../../components/ui/MessageBox'; // Adjusted path
import { LogOut } from 'lucide-react';

const UserProfilePage = () => {
  const { user, apiRequest, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    if (newPassword.length < 8) {
        setMessage({ text: "New password must be at least 8 characters long.", type: 'error'});
        setIsLoading(false);
        return;
    }
    try {
      await apiRequest('AUTH', '/change-password', 'POST', { old_password: oldPassword, new_password: newPassword });
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) return <div className="p-6 text-brand-textLight">Loading profile...</div>; // Or redirect

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-text">My Profile</h1>
      <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
      
      <Card title="User Information">
        <div className="space-y-3 text-brand-text">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>First Name:</strong> {user.firstName}</p>
          <p><strong>Last Name:</strong> {user.lastName}</p>
          <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
        </div>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <InputField id="old_password" label="Old Password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          <InputField id="new_password" label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Change Password'}
          </Button>
        </form>
      </Card>
      <Button onClick={() => { logout(); navigate('/login');}} variant="danger" iconLeft={<LogOut size={18}/>} className="mt-6">
        Logout
      </Button>
    </div>
  );
};

export default UserProfilePage;
