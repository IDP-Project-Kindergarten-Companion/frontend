// src/components/features/LogActivityModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; 
import Button from '../ui/Button'; 
import InputField from '../ui/InputField'; 
import Modal from '../ui/Modal'; 
import MessageBox from '../ui/MessageBox'; 

const LogActivityModal = ({ isOpen, onClose, activityType, childId, onActivityLogged }) => {
  const { apiRequest } = useAuth();
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessage({ text: '', type: '' }); 
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      switch (activityType) {
        case 'meal':
          setFormData({ timestamp: localDateTime, notes: '' });
          break;
        case 'nap':
          // Assuming backend expects snake_case for these from typical API design
          setFormData({ start_time: localDateTime, end_time: localDateTime, woke_up_during: false, notes: '' });
          break;
        case 'drawing':
          // Aligning with test script's photoUrl
          setFormData({ timestamp: localDateTime, photoUrl: '', title: '', description: '' });
          break;
        case 'behavior':
          // Input field will be 'activitiesInput' for comma-separated string, then converted to array
          setFormData({ date: localDate, activitiesInput: '', grade: 'Good', notes: '' });
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
    
    // Backend test script uses 'childId' (camelCase) in payloads for /log endpoints.
    // Ensure your backend activity-log-service expects 'childId' and not 'child_id' in the body.
    let payload = { childId: childId }; 
    let endpoint = ''; 

    try {
      switch (activityType) {
        case 'meal':
          endpoint = '/log/meal'; 
          payload = { ...payload, timestamp: new Date(formData.timestamp).toISOString(), notes: formData.notes };
          break;
        case 'nap':
          endpoint = '/log/nap'; 
          payload = { 
            ...payload, 
            // Using snake_case as it's common for backend, but verify with your API. Test script uses camelCase.
            startTime: new Date(formData.start_time).toISOString(), 
            endTime: new Date(formData.end_time).toISOString(), 
            wokeUpDuring: !!formData.woke_up_during, // Ensure boolean
            notes: formData.notes 
          };
          // If backend strictly follows test script for nap:
          // payload = { 
          //   ...payload, 
          //   startTime: new Date(formData.start_time).toISOString(), 
          //   endTime: new Date(formData.end_time).toISOString(), 
          //   wokeUpDuring: !!formData.woke_up_during, 
          //   notes: formData.notes 
          // };
          break;
        case 'drawing':
          endpoint = '/log/drawing'; 
          payload = { 
            ...payload, 
            timestamp: new Date(formData.timestamp).toISOString(), 
            photoUrl: formData.photoUrl, // Matches test script
            title: formData.title, 
            description: formData.description 
          };
          break;
        case 'behavior':
          endpoint = '/log/behavior'; 
          payload = { 
            ...payload, 
            date: formData.date, 
            activities: formData.activitiesInput.split(',').map(s => s.trim()).filter(s => s), // Matches test script
            grade: formData.grade, 
            notes: formData.notes 
          };
          break;
        default:
          setIsLoading(false);
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
            {/* Using snake_case for form field names to match potential backend expectation, then map to camelCase if needed in payload */}
            <InputField id="start_time" name="start_time" label="Start Time" type="datetime-local" value={formData.start_time || ''} onChange={handleChange} required />
            <InputField id="end_time" name="end_time" label="End Time" type="datetime-local" value={formData.end_time || ''} onChange={handleChange} required />
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" name="woke_up_during" checked={!!formData.woke_up_during} onChange={handleChange} className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-secondary border-brand-border bg-brand-surface" />
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
            <InputField id="activitiesInput" name="activitiesInput" label="Activities (comma-separated)" value={formData.activitiesInput || ''} onChange={handleChange} placeholder="e.g., Circle time, Outdoor play" required />
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
