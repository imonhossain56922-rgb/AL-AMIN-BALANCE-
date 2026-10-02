import React from 'react';
import { Home, Users, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  contactsBadge?: number;
  transactionsBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  contactsBadge,
  transactionsBadge,
}) => {
  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'contacts' as ActiveTab,
      label: 'Contacts',
      icon: Users,
      badge: contactsBadge,
    },
    {
      id: 'transactions' as ActiveTab,
      label: 'Transactions',
      icon: ClipboardList,
      badge: transactionsBadge,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 safe-bottom shadow-lg shadow-slate-900/5">
      <div className="max-w-md mx-auto px-4 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 min-h-[48px] min-w-[48px] transition-all select-none ${
                isActive
                  ? 'text-emerald-600 font-bold scale-102'
                  : 'text-slate-400 hover:text-slate-700 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.4px] -translate-y-0.5' : 'stroke-[1.8px]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold text-emerald-600' : 'font-medium'}`}>
                {item.label}
              </span>

              {/* Active Fintech Pill Indicator */}
              {isActive && (
                <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
