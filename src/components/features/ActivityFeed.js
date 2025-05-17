// src/components/features/ActivityFeed.js
import React, { useState } from 'react';
import Card from '../ui/Card'; // Adjusted path
import { Sun, Moon, Image as ImageIcon, Award, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const ActivityFeed = ({ activities, isLoading }) => {
  const [openActivityId, setOpenActivityId] = useState(null);

  if (isLoading) return <div className="p-4 text-center text-brand-textLight">Loading activities...</div>;
  if (!activities || activities.length === 0) {
    return (
      <Card title="Activity Feed">
        <p className="text-brand-textLight">No activities logged yet for this child.</p>
      </Card>
    );
  }

  const toggleActivityDetails = (activityId) => {
    setOpenActivityId(openActivityId === activityId ? null : activityId);
  };
  
  const getIconForActivity = (type) => {
    switch(type) {
      case 'meal': return <Sun className="text-brand-secondary" />;
      case 'nap': return <Moon className="text-brand-info" />; 
      case 'drawing': return <ImageIcon className="text-brand-primary" />; // Changed color for variety
      case 'behavior': return <Award className="text-brand-success" />;
      default: return <BookOpen className="text-brand-textLight" />;
    }
  };

  return (
    <Card title="Activity Feed">
      <ul className="space-y-4">
        {activities.map(activity => (
          <li key={activity.activity_id || activity.id} className="bg-brand-background p-4 rounded-lg shadow-sm border border-brand-border">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => toggleActivityDetails(activity.activity_id || activity.id)}
              role="button" // for accessibility
              tabIndex={0} // for accessibility
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleActivityDetails(activity.activity_id || activity.id); }} // for accessibility
            >
              <div className="flex items-center">
                <span className="mr-3">{getIconForActivity(activity.type)}</span>
                <h3 className="text-md font-semibold text-brand-primary capitalize">{activity.type}</h3>
                <span className="ml-3 text-sm text-brand-textLight">
                  {new Date(activity.timestamp || activity.start_time || activity.date).toLocaleString()}
                </span>
              </div>
              {openActivityId === (activity.activity_id || activity.id) ? 
                <ChevronUp size={20} className="text-brand-textLight" /> : 
                <ChevronDown size={20} className="text-brand-textLight" />}
            </div>
            {openActivityId === (activity.activity_id || activity.id) && (
              <div className="mt-3 pl-8 text-sm text-brand-text space-y-1">
                {activity.notes && <p><strong>Notes:</strong> {activity.notes}</p>}
                {activity.type === 'meal' && (<></>)} {/* Meal notes already covered by general notes */}
                {activity.type === 'nap' && (
                  <>
                    <p><strong>Start:</strong> {new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>End:</strong> {new Date(activity.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Woke up during:</strong> {activity.woke_up_during ? 'Yes' : 'No'}</p>
                  </>
                )}
                {activity.type === 'drawing' && (
                  <>
                    {activity.title && <p><strong>Title:</strong> {activity.title}</p>}
                    {activity.description && <p><strong>Description:</strong> {activity.description}</p>}
                    {activity.photo_url && <p><strong>Image:</strong> <a href={activity.photo_url} target="_blank" rel="noopener noreferrer" className="text-brand-secondaryHover hover:underline">View Image</a></p>}
                    {/* Fallback if image_url was used previously */}
                    {!activity.photo_url && activity.image_url && <p><strong>Image:</strong> <a href={activity.image_url} target="_blank" rel="noopener noreferrer" className="text-brand-secondaryHover hover:underline">View Image</a></p>}
                  </>
                )}
                {activity.type === 'behavior' && (
                  <>
                    <p><strong>Date:</strong> {new Date(activity.date).toLocaleDateString()}</p>
                    {activity.activities_description && <p><strong>Activities:</strong> {activity.activities_description}</p>}
                    {/* Fallback for older data structure */}
                    {activity.activities && Array.isArray(activity.activities) && !activity.activities_description && <p><strong>Activities:</strong> {activity.activities.join(', ')}</p>}
                    {activity.grade && <p><strong>Grade:</strong> {activity.grade}</p>}
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default ActivityFeed;
