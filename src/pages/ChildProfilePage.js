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
  const { childId } = useParams(); 
  const navigate = useNavigate();
  const { apiRequest, user } = useAuth();
  
  const [childData, setChildData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [activitiesError, setActivitiesError] = useState('');
  const [pageMessage, setPageMessage] = useState({text: '', type: ''});
  const [isEditing, setIsEditing] = useState(false);
  const [editableChildData, setEditableChildData] = useState(null);
  const [showLogActivityModal, setShowLogActivityModal] = useState(false);
  const [activityTypeToLog, setActivityTypeToLog] = useState('');

  const fetchActivities = useCallback(async () => {
    if (!childId) return;
    setIsLoadingActivities(true);
    setActivitiesError('');
    try {
      const params = new URLSearchParams({ child_id: childId }); // Backend expects child_id
      const data = await apiRequest('ACTIVITY_LOG', `/activities?${params.toString()}`, 'GET');
      setActivities(Array.isArray(data) ? data : (data.activities || [])); 
    } catch (err) {
      setActivitiesError(err.message || 'Failed to load activities.');
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [childId, apiRequest]);

  const fetchChildData = useCallback(async () => {
    if (!childId) {
        setProfileError("No child ID provided.");
        setIsLoadingProfile(false);
        return;
    }
    setIsLoadingProfile(true);
    setProfileError(''); 
    setPageMessage({text: '', type: ''});
    try {
      const data = await apiRequest('CHILD_PROFILE', `/children/${childId}`, 'GET');
      setChildData(data);
      setEditableChildData({...data}); 
    } catch (err) {
      setProfileError(err.message || 'Failed to load child profile.');
      setChildData(null); 
    } finally {
      setIsLoadingProfile(false);
    }
  }, [childId, apiRequest]);

  useEffect(() => {
    fetchChildData();
    fetchActivities();
  }, [childId, fetchChildData, fetchActivities]);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableChildData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!editableChildData) return;
    setPageMessage({text: '', type: ''}); 
    try {
      const dataToUpdate = { ...editableChildData };
      if (dataToUpdate.birthday && dataToUpdate.birthday.includes('T')) {
          dataToUpdate.birthday = dataToUpdate.birthday.split('T')[0];
      }
      // Exclude fields that shouldn't be sent or are managed by backend (like IDs)
      const { _id, parent_ids, supervisor_ids, created_at, linking_code, ...payload } = dataToUpdate; 

      const updatedChild = await apiRequest('CHILD_PROFILE', `/children/${childId}`, 'PUT', payload);
      setChildData(updatedChild); 
      setEditableChildData({...updatedChild});
      setIsEditing(false);
      setPageMessage({text: "Profile updated successfully!", type: "success"});
    } catch (err) {
      setPageMessage({text: `Update Error: ${err.message || "Failed to update child profile."}`, type: "error"});
    }
  };
  
  const openLogActivityModal = (type) => {
    setActivityTypeToLog(type);
    setShowLogActivityModal(true);
  };

  const onActivityLogged = () => {
    setShowLogActivityModal(false);
    setPageMessage({text: "Activity logged successfully!", type: "success"});
    fetchActivities(); 
    setTimeout(() => setPageMessage({text: '', type: ''}), 3000);
  };

  // Determine if the current user is the parent or a linked supervisor of this child
  // IMPORTANT: Adjust 'childData.parent_ids' and 'childData.supervisor_ids' to match your backend API response.
  const isUserParentOfThisChild = user && childData && childData.parent_ids && childData.parent_ids.includes(user.id);
  const isUserLinkedSupervisor = user && childData && childData.supervisor_ids && childData.supervisor_ids.includes(user.id);
  
  // User can edit if they are a parent of this child.
  const canEditProfile = isUserParentOfThisChild;
  // User can log activity if they are a parent OR a linked supervisor.
  const canLogActivity = isUserParentOfThisChild || isUserLinkedSupervisor;


  if (isLoadingProfile) return <div className="p-6 text-center text-brand-textLight">Loading child profile...</div>;
  
  if (profileError && !childData) {
      return (
          <div className="p-6">
              <MessageBox message={profileError} type="error" onDismiss={() => setProfileError('')} />
              <Button onClick={() => navigate('/dashboard')} variant="secondary" className="mt-4">Back to Dashboard</Button>
          </div>
      );
  }
  if (!childData) { 
      return <div className="p-6 text-center text-brand-textLight">Child data not found or you may not have permission to view it.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-brand-text mb-2 sm:mb-0">{childData.name}</h1>
        <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
      </div>
      
      {pageMessage.text && <MessageBox message={pageMessage.text} type={pageMessage.type} onDismiss={() => setPageMessage({text:'', type:''})} />}
      {profileError && !pageMessage.text && <MessageBox message={profileError} type="error" onDismiss={() => setProfileError('')} />}

      <Card title="Child Details">
        {!isEditing ? (
          <div className="space-y-2 text-brand-text">
            <p><strong>Name:</strong> {childData.name}</p>
            <p><strong>Birthday:</strong> {childData.birthday ? new Date(childData.birthday).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Group:</strong> {childData.group || 'N/A'}</p>
            <p><strong>Allergies:</strong> {childData.allergies && Array.isArray(childData.allergies) ? childData.allergies.join(', ') : (childData.allergies || 'None')}</p>
            <p><strong>Notes:</strong> {childData.notes || 'None'}</p>
            {canEditProfile && 
              <Button onClick={handleEditToggle} iconLeft={<Edit3 size={16}/>} variant="secondary" className="mt-2">Edit Profile</Button>
            }
          </div>
        ) : ( 
          <div className="space-y-4">
            <InputField id="name" name="name" label="Name" value={editableChildData?.name || ''} onChange={handleInputChange} />
            <InputField id="birthday" name="birthday" label="Birthday" type="date" value={editableChildData?.birthday?.split('T')[0] || ''} onChange={handleInputChange} />
            <InputField id="group" name="group" label="Group" value={editableChildData?.group || ''} onChange={handleInputChange} />
            <InputField id="allergies" name="allergies" label="Allergies (comma-separated)" value={Array.isArray(editableChildData?.allergies) ? editableChildData.allergies.join(',') : (editableChildData?.allergies || '')} onChange={handleInputChange} />
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-brand-textLight mb-1">Notes</label>
              <textarea id="notes" name="notes" rows="3" value={editableChildData?.notes || ''} onChange={handleInputChange} className="block w-full px-3 py-2 border border-brand-border bg-brand-surface text-brand-text rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"></textarea>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSaveChanges}>Save Changes</Button>
              <Button onClick={handleEditToggle} variant="ghost">Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      {canLogActivity && (
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
      {activitiesError && <MessageBox message={activitiesError} type="error" onDismiss={() => setActivitiesError('')} />}

    </div>
  );
};

export default ChildProfilePage;
