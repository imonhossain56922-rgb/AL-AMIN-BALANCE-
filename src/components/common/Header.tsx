import React, { useState } from 'react';
import { Bell, WifiOff, X, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'ALARMENS BALANCE',
  subtitle = 'Personal Money Manager',
  rightAction,
}) => {
  const isOnline = useOnlineStatus();
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications representing real financial reminders
  const notifications = [
    {
      id: '1',
      title: 'Payment Reminder',
      desc: 'Rahim Ahmed has AED 50.00 remaining balance to receive.',
      time: '1h ago',
      type: 'receive',
    },
    {
      id: '2',
      title: 'Settlement Confirmed',
      desc: 'Hasan Ahmed settled AED 150.00 full account.',
      time: '1d ago',
      type: 'paid',
    },
    {
      id: '3',
      title: 'Upcoming Payable',
      desc: 'Karim Ahmed payment for graphic design pending (AED 50.00).',
      time: '2d ago',
      type: 'pay',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Fintech AB Brand Emblem */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 p-0.5 border border-emerald-500/30 shadow-md shadow-emerald-500/10 flex items-center justify-center">
            <div className="w-full h-full bg-emerald-50 rounded-[14px] flex items-center justify-center">
              <span className="text-emerald-700 font-black text-sm tracking-wider">
                AB
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h1>
              {title === 'ALARMENS BALANCE' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PRO
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 tracking-tight">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}

          {rightAction ? (
            rightAction
          ) : (
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition flex items-center justify-center shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Notification active dot */}
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          )}
        </div>
      </header>

      {/* Notifications Drawer / Popover */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Notifications & Alerts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="py-3 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center mt-0.5 shrink-0">
                    {n.type === 'receive' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    ) : n.type === 'pay' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              className="mt-3 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
