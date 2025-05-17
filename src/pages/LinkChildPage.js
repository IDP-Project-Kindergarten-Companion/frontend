// src/pages/LinkChildPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../../components/ui/Button'; // Adjusted path
import Card from '../../components/ui/Card'; // Adjusted path
import InputField from '../../components/ui/InputField'; // Adjusted path
import MessageBox from '../../components/ui/MessageBox'; // Adjusted path
import { Link2 } from 'lucide-react';

const LinkChildPage = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [linkingCode, setLinkingCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    try {
      await apiRequest('CHILD_PROFILE', '/children/link-supervisor', 'POST', { linking_code: linkingCode });
      setMessage({ text: 'Successfully linked to child!', type: 'success' });
      setLinkingCode('');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) { 
      setMessage({ text: err.message || 'Failed to link to child. Invalid or expired code.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-brand-text mb-6">Link to a Child</h1>
      <Card>
        <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField id="linkingCode" label="Linking Code" value={linkingCode} onChange={e => setLinkingCode(e.target.value)} placeholder="Enter code from parent" required />
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={isLoading} iconLeft={<Link2 size={18}/>}>
              {isLoading ? 'Linking...' : 'Link to Child'}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LinkChildPage;
