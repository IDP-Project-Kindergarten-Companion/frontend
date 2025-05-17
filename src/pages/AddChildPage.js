// src/pages/AddChildPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../../components/ui/Button'; // Adjusted path
import Card from '../../components/ui/Card'; // Adjusted path
import InputField from '../../components/ui/InputField'; // Adjusted path
import MessageBox from '../../components/ui/MessageBox'; // Adjusted path
import { PlusCircle } from 'lucide-react';

const AddChildPage = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', birthday: '', group: '', allergies: '', notes: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [linkingCode, setLinkingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLinkingCode('');
    setIsLoading(true);
    try {
      const response = await apiRequest('CHILD_PROFILE', '/children', 'POST', formData);
      setMessage({ text: 'Child added successfully!', type: 'success' });
      setLinkingCode(response.linking_code);
      setFormData({ name: '', birthday: '', group: '', allergies: '', notes: '' }); 
      // Optionally navigate away or clear form after some time
      // setTimeout(() => navigate('/dashboard'), 3000); // Example
    } catch (err) {
      setMessage({ text: err.message || 'Failed to add child.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-brand-text mb-6">Add New Child</h1>
      <Card>
        <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
        {linkingCode && (
          <div className="my-4 p-3 bg-brand-infoBg border border-brand-info rounded-lg">
            <p className="font-semibold text-brand-info">Child Added! Share this Linking Code with Teachers:</p>
            <p className="text-lg font-mono bg-brand-surface p-2 rounded mt-1 break-all text-brand-text">{linkingCode}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField id="name" name="name" label="Child's Name" value={formData.name} onChange={handleChange} required />
          <InputField id="birthday" name="birthday" label="Birthday" type="date" value={formData.birthday} onChange={handleChange} required />
          <InputField id="group" name="group" label="Group/Class" value={formData.group} onChange={handleChange} />
          <InputField id="allergies" name="allergies" label="Allergies (comma-separated)" value={formData.allergies} onChange={handleChange} />
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-brand-textLight mb-1">Additional Notes</label>
            <textarea id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange} className="block w-full px-3 py-2 border border-brand-border bg-brand-surface text-brand-text rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"></textarea>
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={isLoading} iconLeft={<PlusCircle size={18}/>}>
              {isLoading ? 'Adding Child...' : 'Add Child'}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddChildPage;
