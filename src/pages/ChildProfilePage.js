// src/pages/ChildProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import MessageBox from '../components/ui/MessageBox';
import LogActivityModal from '../components/features/LogActivityModal';
import ActivityFeed from '../components/features/ActivityFeed';
import { Edit3, Sun, Moon, Image as ImageIcon, Award } from 'lucide-react';

const ChildProfilePage = () => {
  const { childId } = useParams(); // Get childId from URL
  const navigate = useNavigate();
  const { apiRequest, user } = useAuth();
  
  const [childData, setChildData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({text: '', type: ''});
  const [isEditing, setIsEditing] = useState(false);
  const [editableChildData, setEditableChildData] = useState(null);
  const [showLogActivityModal, setShowLogActivityModal] = useState(false);
  const [activityTypeToLog, setActivityTypeToLog] = useState('');

  const fetchActivities = useCallback(async () => {
    if (!childId) return;
    setIsLoadingActivities(true);
    try {
      const params = new URLSearchParams({ child_id: childId });
      const data = await apiRequest('ACTIVITY_LOG', `/activities?${params.toString()}`, 'GET');
      setActivities(Array.isArray(data) ? data : (data.activities || [])); 
    } catch (err) {
      setError(prev => `${prev ? prev + ' ' : ''}${err.message || 'Failed to load activities.'}`.trim());
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [childId, apiRequest]);

  useEffect(() => {
    if (!childId) {
      setError("No child selected.");
      setIsLoadingProfile(false);
      setIsLoadingActivities(false);
      return;
    }

    const fetchChildData = async () => {
      setIsLoadingProfile(true);
      setError('');
      setMessage({text: '', type: ''});
      try {
        const data = await apiRequest('CHILD_PROFILE', `/children/${childId}`, 'GET');
        setChildData(data);
        setEditableChildData({...data}); 
      } catch (err) {
        setError(err.message || 'Failed to load child profile.');
        setChildData(null); // Ensure childData is null on error
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchChildData();
    fetchActivities();
  }, [childId, apiRequest, fetchActivities]);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableChildData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!editableChildData) return;
    setError('');
    setMessage({text: '', type: ''});
    try {
      const dataToUpdate = { ...editableChildData };
      if (dataToUpdate.birthday && dataToUpdate.birthday.includes('T')) {
          dataToUpdate.birthday = dataToUpdate.birthday.split('T')[0];
      }
      const updatedChild = await apiRequest('CHILD_PROFILE', `/children/${childId}`, 'PUT', dataToUpdate);
      setChildData(updatedChild); 
      setEditableChildData({...updatedChild});
      setIsEditing(false);
      setMessage({text: "Profile updated successfully!", type: "success"});
    } catch (err) {
      // setError(err.message || "Failed to update child profile."); // This might overwrite specific fetch errors
      setMessage({text: err.message || "Failed to update child profile.", type: "error"});
    }
  };
  
  const openLogActivityModal = (type) => {
    setActivityTypeToLog(type);
    setShowLogActivityModal(true);
  };

  const onActivityLogged = () => {
    setShowLogActivityModal(false);
    setMessage({text: "Activity logged successfully!", type: "success"});
    fetchActivities(); // Refresh activities by calling the memoized function
    setTimeout(() => setMessage({text: '', type: ''}), 3000);
  };

  if (isLoadingProfile && !childData) return <div className="p-6 text-center text-brand-textLight">Loading child profile...</div>;
  
  // If there's an error and no child data, show error. Otherwise, proceed to render profile.
  if (error && !childData && !isLoadingProfile) {
      return (
          <div className="p-6">
              <MessageBox message={error} type="error" onDismiss={() => setError('')} />
              <Button onClick={() => navigate('/dashboard')} variant="secondary" className="mt-4">Back to Dashboard</Button>
          </div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-brand-text mb-2 sm:mb-0">{childData?.name || "Child Profile"}</h1>
        <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
      </div>
      
      {/* Display general page errors or success messages for the page */}
      {message.text && <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />}
      {/* Display fetch error if no specific message is set and childData is missing */}
      {error && !message.text && !childData && <MessageBox message={error} type="error" onDismiss={() => setError('')} />}


      <Card title="Child Details">
        {isLoadingProfile ? <p className="text-brand-textLight">Loading details...</p> : childData ? (
          !isEditing ? (
            <div className="space-y-2 text-brand-text">
              <p><strong>Name:</strong> {childData.name}</p>
              <p><strong>Birthday:</strong> {childData.birthday ? new Date(childData.birthday).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Group:</strong> {childData.group || 'N/A'}</p>
              <p><strong>Allergies:</strong> {childData.allergies || 'None'}</p>
              <p><strong>Notes:</strong> {childData.notes || 'None'}</p>
              {(user?.role === 'parent' || user?.id === childData.parent_id) && // Assuming backend provides parent_id
                <Button onClick={handleEditToggle} iconLeft={<Edit3 size={16}/>} variant="secondary" className="mt-2">Edit Profile</Button>
              }
            </div>
          ) : ( 
            <div className="space-y-4">
              <InputField id="name" name="name" label="Name" value={editableChildData?.name || ''} onChange={handleInputChange} />
              <InputField id="birthday" name="birthday" label="Birthday" type="date" value={editableChildData?.birthday?.split('T')[0] || ''} onChange={handleInputChange} />
              <InputField id="group" name="group" label="Group" value={editableChildData?.group || ''} onChange={handleInputChange} />
              <InputField id="allergies" name="allergies" label="Allergies" value={editableChildData?.allergies || ''} onChange={handleInputChange} />
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-brand-textLight mb-1">Notes</label>
                <textarea id="notes" name="notes" rows="3" value={editableChildData?.notes || ''} onChange={handleInputChange} className="block w-full px-3 py-2 border border-brand-border bg-brand-surface text-brand-text rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"></textarea>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
                <Button onClick={handleEditToggle} variant="ghost">Cancel</Button>
              </div>
            </div>
          )
        ) : <p className="text-brand-textLight">No child data available.</p>}
      </Card>

      {/* Only show Log Activity if user is a teacher or the parent of this child */}
      {(user?.role === 'teacher' || (user?.role === 'parent' && childData && user.id === childData.parent_id)) && (
          <Card title="Log New Activity">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => openLogActivityModal('meal')} iconLeft={<Sun size={18} className="text-brand-primary"/>} fullWidth>Log Meal</Button>
              <Button onClick={() => openLogActivityModal('nap')} iconLeft={<Moon size={18} className="text-brand-primary"/>} fullWidth>Log Nap</Button>
              <Button onClick={() => openLogActivityModal('drawing')} iconLeft={<ImageIcon size={18} className="text-brand-primary"/>} fullWidth>Log Drawing</Button>
              <Button onClick={() => openLogActivityModal('behavior')} iconLeft={<Award size={18} className="text-brand-primary"/>} fullWidth>Log Behavior</Button>
            </div>
          </Card>
      )}
      
      <LogActivityModal 
        isOpen={showLogActivityModal} 
        onClose={() => setShowLogActivityModal(false)} 
        activityType={activityTypeToLog} 
        childId={childId}
        onActivityLogged={onActivityLogged}
      />

      <ActivityFeed activities={activities} isLoading={isLoadingActivities} />
    </div>
  );
};

export default ChildProfilePage;
