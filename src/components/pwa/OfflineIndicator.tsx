import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-[#1e1713]/95 px-4 py-2 text-xs font-medium text-amber-300 shadow-xl backdrop-blur-md animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Offline Mode — Cached data is being used. Changes will sync when reconnected.</span>
    </div>
  );
};
