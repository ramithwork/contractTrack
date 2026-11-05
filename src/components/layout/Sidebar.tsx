import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  History,
  BarChart3,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAddContract: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  urgentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAddContract,
  mobileMenuOpen,
  setMobileMenuOpen,
  urgentCount,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: urgentCount > 0 ? `${urgentCount} urgent` : undefined,
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      adminOnly: false,
    },
    {
      id: 'contracts',
      label: 'All Contracts',
      icon: FileText,
      adminOnly: false,
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Building2,
      adminOnly: true,
      tag: 'Admin',
    },
    {
      id: 'users',
      label: 'User Accounts & Roles',
      icon: Users,
      adminOnly: true,
      tag: 'Admin',
    },
    {
      id: 'logs',
      label: 'User Activity Logs',
      icon: History,
      adminOnly: true,
      tag: 'Audit',
    },
    {
      id: 'reports',
      label: 'Departmental Reports',
      icon: BarChart3,
      adminOnly: true,
      tag: 'Admin',
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 shrink-0 flex flex-col justify-between border-r border-[#c5a059]/20 bg-[#171310] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick Action: Register Contract */}
          <button
            onClick={() => {
              onOpenAddContract();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] p-3 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-lg shadow-[#c5a059]/10 hover:brightness-110 active:scale-98 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ ADD NEW CONTRACT</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#c5a059]/70">
              Operations &amp; Reminders
            </p>
            {navItems
              .filter((item) => !item.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#c5a059]/25 to-transparent text-[#f5e1a4] border-l-3 border-[#d4af37]'
                        : 'text-stone-300 hover:bg-[#241d18] hover:text-[#f5e1a4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-stone-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Administration & Security Section */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#c5a059]/70">
                Administration &amp; RBAC
              </p>
              {!isAdmin && (
                <span className="text-[10px] text-stone-500 italic">Locked</span>
              )}
            </div>

            {navItems
              .filter((item) => item.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                if (!isAdmin) {
                  return (
                    <div
                      key={item.id}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-stone-500 opacity-60 cursor-not-allowed"
                      title="Restricted to Administrators"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-stone-600" />
                        <span>{item.label}</span>
                      </div>
                      <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[9px] text-stone-400">
                        Admin
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#c5a059]/25 to-transparent text-[#f5e1a4] border-l-3 border-[#d4af37]'
                        : 'text-stone-300 hover:bg-[#241d18] hover:text-[#f5e1a4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-stone-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.tag && (
                      <span className="rounded bg-[#c5a059]/15 border border-[#c5a059]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#e6ca85]">
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Hotel Details Footer */}
        <div className="p-4 border-t border-[#c5a059]/15 bg-[#14100e]/80 text-[11px] text-stone-400">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-xs text-[#e6ca85]">contractTrack</span>
            <span className="ml-auto text-[10px] text-stone-500 font-mono">v1.4.0</span>
          </div>
          <p className="mt-1 text-[10px] text-stone-400">
            THE GRAND KANDYAN
          </p>
        </div>
      </aside>
    </>
  );
};
