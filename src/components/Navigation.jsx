import React from 'react';
import { Home, Utensils, Dumbbell, Video, Calendar, Sparkles, TrendingUp, BookOpen, ChefHat } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, is1RMDue }) {
  const navItems = [
    { id: 'dashboard', label: 'Today', icon: Home },
    { id: 'meals', label: 'Food Log', icon: Utensils },
    { id: 'mealplan', label: 'Meal Plan', icon: ChefHat },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'weekly', label: 'Review', icon: Calendar }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <IconComponent size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
