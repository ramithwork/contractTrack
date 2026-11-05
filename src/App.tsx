import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ContractList } from './components/contracts/ContractList';
import { ContractModal } from './components/contracts/ContractModal';
import { ContractDetailDrawer } from './components/contracts/ContractDetailDrawer';
import { DepartmentManager } from './components/departments/DepartmentManager';
import { UserManager } from './components/users/UserManager';
import { ActivityLogView } from './components/logs/ActivityLogView';
import { DepartmentReports } from './components/reports/DepartmentReports';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { LoginModal } from './components/auth/LoginModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

import { Contract, Department, User, ActivityLog, ContractNotification } from './types';
import { testConnection } from './firebase/config';
import { UserService, INITIAL_USERS } from './services/userService';
import { DepartmentService, INITIAL_DEPARTMENTS } from './services/departmentService';
import { ContractService, INITIAL_SAMPLE_CONTRACTS } from './services/contractService';
import { ActivityLogService } from './services/activityLogService';
import { NotificationService } from './services/notificationService';
import { getAssetUrl } from './utils/assets';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<ContractNotification[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contractFilter, setContractFilter] = useState<string | undefined>(undefined);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [contractToRenew, setContractToRenew] = useState<Contract | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [newNoticePeriod, setNewNoticePeriod] = useState(30);

  const [isLoading, setIsLoading] = useState(true);

  // Initialize and load data
  const loadData = useCallback(async () => {
    try {
      await testConnection().catch(() => false);

      let loadedDepts: Department[] = [];
      try {
        loadedDepts = (await DepartmentService.getDepartments()) || [];
      } catch (e) {
        console.warn('Departments load notice:', e);
        loadedDepts = INITIAL_DEPARTMENTS;
      }

      let loadedUsers: User[] = [];
      try {
        loadedUsers = (await UserService.initializeUsers()) || [];
      } catch (e) {
        console.warn('Users load notice:', e);
        loadedUsers = INITIAL_USERS.map((u) => ({
          ...u,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      let loadedContracts: Contract[] = [];
      try {
        loadedContracts = (await ContractService.getContracts()) || [];
      } catch (e) {
        console.warn('Contracts load notice:', e);
        loadedContracts = INITIAL_SAMPLE_CONTRACTS.map((c) => ({
          ...c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      setDepartments(loadedDepts.length > 0 ? loadedDepts : INITIAL_DEPARTMENTS);
      setAllUsers(loadedUsers);
      setContracts(loadedContracts);

      // Check current user session
      const savedUser = UserService.getCurrentUser();
      if (savedUser) {
        const freshUser = loadedUsers.find((u) => u.id === savedUser.id) || savedUser;
        setCurrentUser(freshUser);

        try {
          const [userNotifs, auditLogs] = await Promise.all([
            NotificationService.getUserNotifications(freshUser.id).catch(() => []),
            ActivityLogService.getAllLogs().catch(() => []),
          ]);
          setNotifications(userNotifs);
          setLogs(auditLogs);

          // Run background reminder assessment for this user
          NotificationService.evaluateAndSendContractReminders(freshUser, loadedContracts).then(
            (dispatched) => {
              if (dispatched.length > 0) {
                NotificationService.getUserNotifications(freshUser.id).then(setNotifications).catch(() => {});
              }
            }
          ).catch(() => {});
        } catch (e) {
          console.warn('Post-auth data notice:', e);
        }
      }
    } catch (err) {
      console.error('Portal data loader completed with fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic reminder checking interval (every 5 minutes)
  useEffect(() => {
    if (!currentUser || contracts.length === 0) return;

    const interval = setInterval(() => {
      NotificationService.evaluateAndSendContractReminders(currentUser, contracts).then(
        (dispatched) => {
          if (dispatched.length > 0) {
            NotificationService.getUserNotifications(currentUser.id).then(setNotifications);
          }
        }
      );
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser, contracts]);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    const [userNotifs, auditLogs] = await Promise.all([
      NotificationService.getUserNotifications(user.id),
      ActivityLogService.getAllLogs(),
    ]);
    setNotifications(userNotifs);
    setLogs(auditLogs);

    // Evaluate reminders immediately for newly logged in user
    const dispatched = await NotificationService.evaluateAndSendContractReminders(
      user,
      contracts
    );
    if (dispatched.length > 0) {
      const refreshedNotifs = await NotificationService.getUserNotifications(user.id);
      setNotifications(refreshedNotifs);
    }
  };

  const handleLogout = () => {
    UserService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSaveContract = async (
    contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) return;

    if (editingContract) {
      await ContractService.updateContract(editingContract.id, contractData, currentUser);
    } else {
      await ContractService.createContract(contractData, currentUser);
    }

    const freshContracts = await ContractService.getContracts();
    setContracts(freshContracts);

    const freshLogs = await ActivityLogService.getAllLogs();
    setLogs(freshLogs);

    // Re-evaluate notifications
    const dispatched = await NotificationService.evaluateAndSendContractReminders(
      currentUser,
      freshContracts
    );
    if (dispatched.length > 0) {
      const notifs = await NotificationService.getUserNotifications(currentUser.id);
      setNotifications(notifs);
    }
  };

  const handleDeleteContract = async (id: string, title: string) => {
    if (!currentUser) return;
    if (!confirm(`Are you sure you want to permanently delete contract '${title}'?`)) return;

    await ContractService.deleteContract(id, title, currentUser);
    setSelectedContract(null);

    const freshContracts = await ContractService.getContracts();
    setContracts(freshContracts);

    const freshLogs = await ActivityLogService.getAllLogs();
    setLogs(freshLogs);
  };

  const handleOpenRenewModal = (contract: Contract) => {
    setContractToRenew(contract);
    // suggest 1 year extension from current renewal date
    const d = new Date(contract.renewalDate || new Date());
    d.setFullYear(d.getFullYear() + 1);
    setNewRenewalDate(d.toISOString().split('T')[0]);
    setNewNoticePeriod(contract.noticePeriodDays || 30);
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenewal = async () => {
    if (!contractToRenew || !currentUser || !newRenewalDate) return;

    const updates: Partial<Contract> = {
      renewalDate: newRenewalDate,
      endDate: newRenewalDate,
      noticePeriodDays: newNoticePeriod,
      status: 'active',
      lastRenewalDate: new Date().toISOString().split('T')[0],
    };

    await ContractService.updateContract(contractToRenew.id, updates, currentUser);
    setIsRenewModalOpen(false);
    setSelectedContract(null);
    setContractToRenew(null);

    const freshContracts = await ContractService.getContracts();
    setContracts(freshContracts);

    const freshLogs = await ActivityLogService.getAllLogs();
    setLogs(freshLogs);
  };

  const handleRefreshDepartments = async () => {
    const [freshDepts, freshContracts, freshUsers] = await Promise.all([
      DepartmentService.getDepartments(),
      ContractService.getContracts(),
      UserService.getAllUsers(),
    ]);
    setDepartments(freshDepts);
    setContracts(freshContracts);
    setAllUsers(freshUsers);
  };

  const handleRefreshUsers = async () => {
    const freshUsers = await UserService.getAllUsers();
    setAllUsers(freshUsers);
  };

  const handleMarkNotificationAsRead = async (notifId: string) => {
    await NotificationService.markAsRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleDeleteNotification = async (notifId: string) => {
    await NotificationService.deleteNotification(notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleSelectContractById = (contractId: string) => {
    const found = contracts.find((c) => c.id === contractId);
    if (found) {
      setSelectedContract(found);
    }
  };

  const handleManualRemindersCheck = async () => {
    if (!currentUser) return;
    const dispatched = await NotificationService.evaluateAndSendContractReminders(
      currentUser,
      contracts
    );
    const refreshed = await NotificationService.getUserNotifications(currentUser.id);
    setNotifications(refreshed);
    alert(`Reminder scan complete. ${dispatched.length} notifications dispatched.`);
  };

  // Urgent contracts count for sidebar badge
  const urgentCount = contracts.filter((c) => {
    if (c.status !== 'active') return false;
    const urgency = ContractService.calculateUrgency(c.renewalDate);
    return urgency.level === 'urgent' || urgency.level === 'overdue';
  }).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#120f0d] text-[#c5a059]">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#c5a059]/40 bg-[#1c1815] p-2 shadow-2xl">
          <img
            src={getAssetUrl('assets/contract_track_icon.png')}
            alt="contractTrack"
            className="h-full w-full object-contain filter drop-shadow animate-pulse rounded-xl"
          />
        </div>
        <h2 className="mt-4 font-royal text-2xl font-bold tracking-widest text-gold-gradient">
          contractTrack
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#c5a059] font-royal font-semibold">
          THE GRAND KANDYAN
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120f0d] text-[#F3EFEA] flex flex-col">
      {/* Offline Connectivity Warning */}
      <OfflineIndicator />

      {/* Login Modal if not authenticated */}
      {!currentUser && <LoginModal onLoginSuccess={handleLoginSuccess} />}

      {/* Application Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setContractFilter(undefined);
          }}
          currentUser={currentUser}
          onOpenAddContract={() => {
            setEditingContract(null);
            setIsContractModalOpen(true);
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          urgentCount={urgentCount}
        />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              contracts={contracts}
              departments={departments}
              currentUser={currentUser}
              onSelectContract={(c) => setSelectedContract(c)}
              onOpenAddContract={() => {
                setEditingContract(null);
                setIsContractModalOpen(true);
              }}
              onNavigateToContracts={(filter) => {
                setContractFilter(filter);
                setActiveTab('contracts');
              }}
            />
          )}

          {activeTab === 'contracts' && (
            <ContractList
              contracts={contracts}
              departments={departments}
              currentUser={currentUser}
              onSelectContract={(c) => setSelectedContract(c)}
              onOpenAddContract={() => {
                setEditingContract(null);
                setIsContractModalOpen(true);
              }}
              initialFilter={contractFilter}
            />
          )}

          {activeTab === 'departments' && currentUser?.role === 'admin' && (
            <DepartmentManager
              departments={departments}
              contracts={contracts}
              users={allUsers}
              currentUser={currentUser}
              onRefresh={handleRefreshDepartments}
            />
          )}

          {activeTab === 'users' && currentUser?.role === 'admin' && (
            <UserManager
              users={allUsers}
              departments={departments}
              currentUser={currentUser}
              onRefresh={handleRefreshUsers}
            />
          )}

          {activeTab === 'logs' && currentUser?.role === 'admin' && (
            <ActivityLogView logs={logs} users={allUsers} />
          )}

          {activeTab === 'reports' && currentUser?.role === 'admin' && (
            <DepartmentReports
              departments={departments}
              contracts={contracts}
              users={allUsers}
            />
          )}

          {/* Global IT Department Footer with Version Number */}
          <footer className="mt-14 py-6 border-t border-[#c5a059]/20 text-center text-xs text-stone-400">
            <p className="font-medium text-stone-300">
              &copy; The Grand Kandyan Hotel IT Department. All rights reserved.
            </p>
            <p className="mt-1 text-[11px] text-[#c5a059] font-mono">
              contractTrack &bull; Version 1.4.0
            </p>
          </footer>
        </main>
      </div>

      {/* Contract Detail Drawer */}
      <ContractDetailDrawer
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
        onEdit={(c) => {
          setSelectedContract(null);
          setEditingContract(c);
          setIsContractModalOpen(true);
        }}
        onDelete={handleDeleteContract}
        onRenew={(c) => handleOpenRenewModal(c)}
        currentUser={currentUser}
      />

      {/* Add / Edit Contract Modal */}
      {currentUser && (
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setEditingContract(null);
          }}
          onSave={handleSaveContract}
          editingContract={editingContract}
          departments={departments}
          allUsers={allUsers}
          currentUser={currentUser}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onDelete={handleDeleteNotification}
        onSelectContractById={handleSelectContractById}
        onRefreshReminders={handleManualRemindersCheck}
      />

      {/* Quick Renew Contract Dialog */}
      {isRenewModalOpen && contractToRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#c5a059]/40 bg-[#1c1815] shadow-2xl p-6 text-stone-200">
            <h3 className="font-royal text-lg font-bold text-gold-gradient">
              Renew Contract: {contractToRenew.contractNumber}
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              {contractToRenew.title} ({contractToRenew.vendorName})
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#f5e1a4]">
                  New Renewal Decision Target Date
                </label>
                <input
                  type="date"
                  required
                  value={newRenewalDate}
                  onChange={(e) => setNewRenewalDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d4af37] bg-[#2a221d] px-3.5 py-2 text-sm font-semibold text-[#f5e1a4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newNoticePeriod}
                  onChange={(e) => setNewNoticePeriod(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-800 pt-3">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="rounded-xl border border-stone-700 px-4 py-2 text-xs text-stone-400 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRenewal}
                className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] px-4 py-2 text-xs font-bold text-[#14100e] hover:brightness-110"
              >
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
