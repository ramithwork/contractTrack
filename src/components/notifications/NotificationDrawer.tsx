import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Calendar,
  ExternalLink,
  BellRing,
} from 'lucide-react';
import { ContractNotification } from '../../types';
import { NotificationService } from '../../services/notificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ContractNotification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectContractById: (contractId: string) => void;
  onRefreshReminders: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onDelete,
  onSelectContractById,
  onRefreshReminders,
}) => {
  if (!isOpen) return null;

  const isGranted = NotificationService.isPermissionGranted();

  const handleRequestPush = async () => {
    const res = await NotificationService.requestPermission();
    if (res === 'granted') {
      await NotificationService.showNativeNotification('contractTrack — THE GRAND KANDYAN', {
        body: 'Renewal notifications are now enabled on this device.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md h-full bg-[#1a1512] border-l border-[#c5a059]/30 shadow-2xl flex flex-col text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c5a059]/20 bg-[#221b17] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[#c5a059]/20 p-2 text-[#d4af37] border border-[#c5a059]/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-royal text-base font-bold text-gold-gradient">
                Contract Renewal Alerts
              </h2>
              <p className="text-[11px] text-stone-400">
                Reminders for contracts you registered or are assigned to
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Banner if not enabled */}
        {!isGranted && (
          <div className="mx-4 mt-3 rounded-xl border border-[#c5a059]/40 bg-[#251e18] p-3 text-xs text-stone-300">
            <div className="flex items-center gap-2 text-[#f5e1a4] font-bold">
              <BellRing className="w-4 h-4 text-[#d4af37]" />
              <span>Enable Background Push Alerts</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Receive alerts on desktop and mobile even when the browser or app is closed.
            </p>
            <button
              onClick={handleRequestPush}
              className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-1.5 text-xs font-bold text-[#14100e] hover:brightness-110 transition cursor-pointer"
            >
              Grant Notification Permission
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs">
              <Bell className="mx-auto w-8 h-8 text-stone-600 mb-2" />
              <p>No active renewal reminders.</p>
              <p className="text-[10px] text-stone-500 mt-1">
                You will receive alerts when contracts you added or are assigned to reach their reminder window.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUrgent = notif.type === 'renewal_urgent';
              return (
                <div
                  key={notif.id}
                  className={`group relative rounded-xl border p-3.5 transition ${
                    notif.read
                      ? 'border-stone-800 bg-[#201915]/60 opacity-80'
                      : isUrgent
                      ? 'border-rose-500/40 bg-rose-950/20 shadow-md'
                      : 'border-[#c5a059]/30 bg-[#241d18]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isUrgent ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                      )}
                      <span className="font-mono text-[10px] text-[#e6ca85]">
                        {notif.contractNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notif.read && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="rounded p-1 text-[10px] text-stone-400 hover:text-emerald-400"
                          title="Mark as Read"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(notif.id)}
                        className="rounded p-1 text-[10px] text-stone-400 hover:text-rose-400"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-1.5 text-xs font-bold text-stone-200">
                    {notif.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-stone-400 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-stone-500">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => {
                        onSelectContractById(notif.contractId);
                        onClose();
                      }}
                      className="flex items-center gap-1 font-semibold text-[#e6ca85] hover:underline"
                    >
                      <span>View Contract</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#c5a059]/20 bg-[#201915] flex items-center justify-between text-xs">
          <button
            onClick={onRefreshReminders}
            className="text-[11px] text-[#e6ca85] hover:underline"
          >
            Check Renewal Deadlines
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
