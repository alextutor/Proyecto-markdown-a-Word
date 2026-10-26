import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-12 left-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-600 text-white shadow-lg text-xs font-medium border border-amber-500 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <WifiOff className="w-3.5 h-3.5 animate-pulse shrink-0" />
      <span>Modo sin conexión — La conversión a Word sigue activa</span>
    </div>
  );
};
