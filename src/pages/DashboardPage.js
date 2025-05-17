// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import MessageBox from '../components/ui/MessageBox';
import { PlusCircle, Link2 } from 'lucide-react';

const DashboardPage = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        // This API call populates the 'children' array.
        // Ensure the objects in the response array have a consistent ID field.
        // Based on your tests, individual child fetches return '_id'.
        // Let's assume the list endpoint does too.
        const data = await apiRequest('CHILD_PROFILE', '/children', 'GET');
        console.log("Fetched children data for dashboard:", data); // Log the raw data
        
        // Ensure data is an array, or data.children is an array
        const childrenArray = Array.isArray(data) ? data : (data && Array.isArray(data.children) ? data.children : []);
        
        setChildren(childrenArray.map(child => ({
            ...child,
            // Ensure a consistent displayId for navigation, prioritizing _id
            displayId: child._id || child.child_id || child.id 
        })));

      } catch (err) {
        console.error("Error fetching children:", err);
        setError(err.message || 'Failed to load children data.');
        setChildren([]); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, [user, apiRequest]);

  const handleViewChildProfile = (childDisplayId) => {
    if (childDisplayId && childDisplayId !== "undefined") {
      navigate(`/child/${childDisplayId}`);
    } else {
      console.error("Attempted to navigate with undefined childId from dashboard for child object:", 
        children.find(c => (c._id || c.child_id || c.id) === childDisplayId) || "Child object not found or ID is undefined");
      setError("Could not view child profile: Child ID is missing.");
    }
  };

  if (isLoading && !children.length && !error) return <div className="p-6 text-center text-brand-textLight">Loading dashboard...</div>;
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-brand-text">Welcome, {user?.firstName || user?.username}!</h1>
      <MessageBox message={error} type="error" onDismiss={() => setError('')} />
      
      <Card title={user?.role === 'parent' ? "Your Children" : "Linked Children"} className="mt-6">
        {user?.role === 'parent' && (
          <Button onClick={() => navigate('/add-child')} iconLeft={<PlusCircle size={18}/>} className="mb-4">
            Add New Child
          </Button>
        )}
        {user?.role === 'teacher' && (
          <Button onClick={() => navigate('/link-child')} iconLeft={<Link2 size={18}/>} className="mb-4">
            Link to Child via Code
          </Button>
        )}

        {isLoading && <p className="text-brand-textLight">Loading children...</p>}
        {!isLoading && children.length === 0 && !error && (
          <p className="text-brand-textLight">
            {user?.role === 'parent' ? "You haven't added any children yet." : "You are not linked to any children yet."}
          </p>
        )}
        {!isLoading && children.length > 0 && (
          <ul className="divide-y divide-brand-border">
            {children.map(child => {
              // Prioritize _id, then child_id, then id for the key and navigation
              const keyId = child._id || child.child_id || child.id || `fallback-${Math.random()}`;
              const navId = child.displayId; // Use the pre-calculated displayId

              if (!navId) {
                console.warn("Child object missing a usable ID in dashboard list:", child);
              }

              return (
                <li key={keyId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-lg font-medium text-brand-primary">{child.name || "Unnamed Child"}</p>
                    {child.group && <p className="text-sm text-brand-textLight">Group: {child.group}</p>}
                  </div>
                  <Button 
                    onClick={() => navId ? handleViewChildProfile(navId) : setError("Cannot view profile: Child ID missing.")} 
                    variant="secondary"
                    disabled={!navId} // Disable button if no ID
                  >
                    View Profile & Activities
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
