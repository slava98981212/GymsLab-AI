import React from 'react';
import { LayoutDashboard, Utensils, Dumbbell, Video, Award, Calendar } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, is1RMDue }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meals', label: 'Nutrition', icon: Utensils },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'videos', label: 'Form Videos', icon: Video },
    { id: '1rm', label: '1RM Test', icon: Award, badge: is1RMDue },
    { id: 'weekly', label: 'Weekly', icon: Calendar }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span style={{
                position: 'absolute',
                top: '0px',
                right: '18%',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-cyan)',
                boxShadow: '0 0 8px var(--primary-cyan)'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
