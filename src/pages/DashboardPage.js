// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../../components/ui/Button'; // Adjusted path
import Card from '../../components/ui/Card'; // Adjusted path
import MessageBox from '../../components/ui/MessageBox'; // Adjusted path
import { PlusCircle, Link2 } from 'lucide-react';

const DashboardPage = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await apiRequest('CHILD_PROFILE', '/children', 'GET');
        setChildren(Array.isArray(data) ? data : (data.children || [])); 
      } catch (err) {
        setError(err.message || 'Failed to load children data.');
        setChildren([]); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, [user, apiRequest]);

  const handleViewChildProfile = (childId) => {
    navigate(`/child/${childId}`); // Navigate to child's profile using URL
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
            {children.map(child => (
              <li key={child.child_id || child.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-lg font-medium text-brand-primary">{child.name}</p>
                  {child.group && <p className="text-sm text-brand-textLight">Group: {child.group}</p>}
                </div>
                <Button onClick={() => handleViewChildProfile(child.child_id || child.id)} variant="secondary">
                  View Profile & Activities
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
