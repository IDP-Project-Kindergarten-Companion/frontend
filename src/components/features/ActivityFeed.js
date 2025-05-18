// src/components/features/ActivityFeed.js
import React, { useState } from 'react';
import Card from '../ui/Card';
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
    switch(type?.toLowerCase()) {
      case 'meal': return <Sun className="text-brand-secondary" />;
      case 'nap': return <Moon className="text-brand-info" />; 
      case 'drawing': return <ImageIcon className="text-brand-primary" />;
      case 'behavior': return <Award className="text-brand-success" />;
      default: return <BookOpen className="text-brand-textLight" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string received:", dateString);
      return 'Invalid Date';
    }
    return date.toLocaleString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    // For 'YYYY-MM-DD' strings, new Date() might interpret them as UTC.
    // To ensure it's treated as local, we can split and reconstruct.
    let date;
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = dateString.split('-');
        date = new Date(parts[0], parts[1] - 1, parts[2]); // Month is 0-indexed
    } else {
        date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  };


  return (
    <Card title="Activity Feed">
      <ul className="space-y-4">
        {activities.map(activity => {
          const displayTimestamp = activity.timestamp || activity.start_time || activity.date;
          const activityKey = activity.activity_id || activity.id || `${activity.type}-${displayTimestamp}-${Math.random()}`;

          return (
            <li key={activityKey} className="bg-brand-background p-4 rounded-lg shadow-sm border border-brand-border">
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => toggleActivityDetails(activityKey)}
                role="button" 
                tabIndex={0} 
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleActivityDetails(activityKey); }}
              >
                <div className="flex items-center">
                  <span className="mr-3">{getIconForActivity(activity.type)}</span>
                  <h3 className="text-md font-semibold text-brand-primary capitalize">{activity.type || "Unknown Activity"}</h3>
                  <span className="ml-3 text-sm text-brand-textLight">
                    {formatDate(displayTimestamp)}
                  </span>
                </div>
                {openActivityId === activityKey ? 
                  <ChevronUp size={20} className="text-brand-textLight" /> : 
                  <ChevronDown size={20} className="text-brand-textLight" />}
              </div>
              {openActivityId === activityKey && (
                <div className="mt-3 pl-8 text-sm text-brand-text space-y-1">
                  {activity.notes && <p><strong>Notes:</strong> {activity.notes}</p>}
                  
                  {activity.type?.toLowerCase() === 'nap' && (
                    <>
                      {activity.start_time && <p><strong>Start:</strong> {formatTime(activity.start_time)}</p>}
                      {activity.end_time && <p><strong>End:</strong> {formatTime(activity.end_time)}</p>}
                      {typeof activity.woke_up_during !== 'undefined' && <p><strong>Woke up during:</strong> {activity.woke_up_during ? 'Yes' : 'No'}</p>}
                    </>
                  )}
                  {activity.type?.toLowerCase() === 'drawing' && (
                    <>
                      {activity.title && <p><strong>Title:</strong> {activity.title}</p>}
                      {activity.description && <p><strong>Description:</strong> {activity.description}</p>}
                      {(activity.photo_url || activity.image_url) && 
                        <p><strong>Image:</strong> <a href={activity.photo_url || activity.image_url} target="_blank" rel="noopener noreferrer" className="text-brand-secondaryHover hover:underline">View Image</a></p>
                      }
                    </>
                  )}
                  {activity.type?.toLowerCase() === 'behavior' && (
                    <>
                      {activity.date && <p><strong>Date:</strong> {formatDateOnly(activity.date)}</p>}
                      {activity.activities && Array.isArray(activity.activities) && activity.activities.length > 0 &&
                        <p><strong>Activities:</strong> {activity.activities.join(', ')}</p>
                      }
                      {activity.activities_description && typeof activity.activities_description === 'string' &&
                          <p><strong>Activities:</strong> {activity.activities_description}</p>
                      }
                      {activity.grade && <p><strong>Grade:</strong> {activity.grade}</p>}
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default ActivityFeed;
