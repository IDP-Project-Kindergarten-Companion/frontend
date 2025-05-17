// src/components/features/LogActivityModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../ui/Button'; // Adjusted path
import InputField from '../ui/InputField'; // Adjusted path
import Modal from '../ui/Modal'; // Adjusted path
import MessageBox from '../ui/MessageBox'; // Adjusted path

const LogActivityModal = ({ isOpen, onClose, activityType, childId, onActivityLogged }) => {
  const { apiRequest } = useAuth();
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessage({ text: '', type: '' }); 
      // Default form data based on activity type
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];


      switch (activityType) {
        case 'meal':
          setFormData({ timestamp: localDateTime, notes: '' });
          break;
        case 'nap':
          setFormData({ startTime: localDateTime, endTime: localDateTime, wokeUpDuring: false, notes: '' });
          break;
        case 'drawing':
          setFormData({ timestamp: localDateTime, photoUrl: '', title: '', description: '' });
          break;
        case 'behavior':
          setFormData({ date: localDate, activities_description: '', grade: 'Good', notes: '' });
          break;
        default:
          setFormData({});
      }
    }
  }, [isOpen, activityType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    
    let endpoint = ''; 
    let payload = { ...formData, child_id: childId }; // Ensure child_id is used as per backend expectation

    try {
      switch (activityType) {
        case 'meal':
          endpoint = '/log/meal'; 
          payload = { child_id: childId, timestamp: new Date(formData.timestamp).toISOString(), notes: formData.notes };
          break;
        case 'nap':
          endpoint = '/log/nap'; 
          payload = { child_id: childId, start_time: new Date(formData.startTime).toISOString(), end_time: new Date(formData.endTime).toISOString(), woke_up_during: !!formData.wokeUpDuring, notes: formData.notes };
          break;
        case 'drawing':
          endpoint = '/log/drawing'; 
          payload = { child_id: childId, timestamp: new Date(formData.timestamp).toISOString(), photo_url: formData.photoUrl, title: formData.title, description: formData.description };
          break;
        case 'behavior':
          endpoint = '/log/behavior'; 
          // Ensure activities_description is sent, not 'activities' if backend expects that
          payload = { child_id: childId, date: formData.date, activities_description: formData.activities_description, grade: formData.grade, notes: formData.notes };
          break;
        default:
          throw new Error("Invalid activity type");
      }
      await apiRequest('ACTIVITY_LOG', endpoint, 'POST', payload);
      setIsLoading(false);
      onActivityLogged(); 
    } catch (err) {
      setMessage({ text: err.message || `Failed to log ${activityType}.`, type: 'error' });
      setIsLoading(false);
    }
  };
  
  const renderFormFields = () => {
    switch (activityType) {
      case 'meal':
        return (
          <>
            <InputField id="timestamp" name="timestamp" label="Timestamp" type="datetime-local" value={formData.timestamp || ''} onChange={handleChange} required />
            <InputField id="notes" name="notes" label="Notes (e.g., what was eaten, quantity)" value={formData.notes || ''} onChange={handleChange} required />
          </>
        );
      case 'nap':
        return (
          <>
            <InputField id="startTime" name="startTime" label="Start Time" type="datetime-local" value={formData.startTime || ''} onChange={handleChange} required />
            <InputField id="endTime" name="endTime" label="End Time" type="datetime-local" value={formData.endTime || ''} onChange={handleChange} required />
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" name="wokeUpDuring" checked={!!formData.wokeUpDuring} onChange={handleChange} className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-secondary border-brand-border bg-brand-surface" />
                <span className="ml-2 text-sm text-brand-textLight">Woke up during nap?</span>
              </label>
            </div>
            <InputField id="notes" name="notes" label="Notes (optional)" value={formData.notes || ''} onChange={handleChange} />
          </>
        );
      case 'drawing':
        return (
          <>
            <InputField id="timestamp" name="timestamp" label="Timestamp" type="datetime-local" value={formData.timestamp || ''} onChange={handleChange} required />
            <InputField id="photoUrl" name="photoUrl" label="Photo URL" type="url" value={formData.photoUrl || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" required />
            <InputField id="title" name="title" label="Title (optional)" value={formData.title || ''} onChange={handleChange} />
            <InputField id="description" name="description" label="Description (optional)" value={formData.description || ''} onChange={handleChange} />
          </>
        );
      case 'behavior':
        return (
          <>
            <InputField id="date" name="date" label="Date" type="date" value={formData.date || ''} onChange={handleChange} required />
            <InputField id="activities_description" name="activities_description" label="Activities Description" value={formData.activities_description || ''} onChange={handleChange} placeholder="e.g., Played well with others during circle time." required />
            <div className="mb-4">
                <label htmlFor="grade" className="block text-sm font-medium text-brand-textLight mb-1">Grade <span className="text-brand-error">*</span></label>
                <select id="grade" name="grade" value={formData.grade || 'Good'} onChange={handleChange} className="block w-full px-3 py-2 border border-brand-border bg-brand-surface text-brand-text rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                </select>
            </div>
            <InputField id="notes" name="notes" label="Notes (optional)" value={formData.notes || ''} onChange={handleChange} />
          </>
        );
      default:
        return <p className="text-brand-textLight">Unknown activity type.</p>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log ${activityType ? activityType.charAt(0).toUpperCase() + activityType.slice(1) : ''}`}>
      <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderFormFields()}
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging...' : `Log ${activityType}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogActivityModal;
