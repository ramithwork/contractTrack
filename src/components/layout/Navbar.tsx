import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Building2,
  BellRing,
  Menu,
  X,
} from 'lucide-react';
import { User, ContractNotification } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { NotificationService } from '../../services/notificationService';

interface NavbarProps {
  currentUser: User | null;
  notifications: ContractNotification[];
  onOpenNotifications: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notifications,
  onOpenNotifications,
  onLogout,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTestNotification = async () => {
    const perm = await NotificationService.requestPermission();
    if (perm === 'granted') {
      await NotificationService.showNativeNotification('contractTrack — THE GRAND KANDYAN', {
        body: 'Desktop & mobile notifications active! You will be alerted for contract renewals.',
      });
    } else {
      alert('Notification permission was ' + perm + '. Please enable notifications in your browser settings.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#c5a059]/25 bg-[#161210]/95 backdrop-blur-md shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
        {/* Brand & Crest */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-1.5 text-[#c5a059] hover:bg-[#28221d] transition"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* contractTrack App Icon */}
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#c5a059]/40 bg-[#1e1713] p-1 shadow-inner group-hover:border-[#c5a059] transition-all">
              <img
                src="/assets/contract_track_icon.png"
                alt="contractTrack"
                className="h-full w-full object-contain filter drop-shadow rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-royal text-base sm:text-lg font-bold tracking-wider text-gold-gradient">
                  contractTrack
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#c5a059] tracking-widest uppercase font-semibold font-royal">
                THE GRAND KANDYAN
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Test Notification Trigger */}
          <button
            onClick={handleTestNotification}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#c5a059]/30 bg-[#201915] px-2.5 py-1.5 text-xs text-[#e6ca85] hover:bg-[#2c231e] hover:border-[#c5a059]/60 transition"
            title="Verify Desktop & Mobile Push Alerts"
          >
            <BellRing className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Enable Alerts</span>
          </button>

          {/* In-App Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative rounded-lg p-2 text-stone-300 hover:text-[#f5e1a4] hover:bg-[#28221d] transition cursor-pointer"
            title="Contract Renewal Reminders"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Pill & Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-xl border border-[#c5a059]/30 bg-[#1e1713] px-2.5 py-1.5 text-left hover:border-[#c5a059]/60 hover:bg-[#28221d] transition cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#8c6d2b] to-[#d4af37] text-xs font-bold text-[#14100e]">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-stone-200 line-clamp-1">
                    {currentUser.displayName}
                  </p>
                  <p className="text-[10px] text-[#c5a059] flex items-center gap-1">
                    {currentUser.role === 'admin' ? (
                      <span className="flex items-center gap-0.5 text-[#f59e0b]">
                        <Shield className="w-2.5 h-2.5" /> Admin
                      </span>
                    ) : (
                      <span>{currentUser.departmentName}</span>
                    )}
                  </p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#c5a059]/40 bg-[#1c1815] p-2 shadow-2xl backdrop-blur-xl z-50">
                  <div className="px-3 py-2 border-b border-[#c5a059]/20">
                    <p className="text-xs font-bold text-[#f5e1a4]">{currentUser.displayName}</p>
                    <p className="text-[11px] text-stone-400 font-mono">@{currentUser.username}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-[#c5a059]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#e6ca85] uppercase">
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {currentUser.departmentName}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleTestNotification();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-stone-300 hover:bg-[#28221d] hover:text-[#f5e1a4]"
                    >
                      <BellRing className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Test Push Notification</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
