import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  User as UserIcon,
  Calendar,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  Building2,
} from 'lucide-react';
import { ActivityLog, User } from '../../types';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  users: User[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, users }) => {
  const [selectedUserId, setSelectedUserId] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesUser = selectedUserId === 'ALL' || log.userId === selectedUserId;
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesUser && matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CONTRACT_CREATED':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
      case 'CONTRACT_RENEWED':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/30';
      case 'CONTRACT_UPDATED':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/30';
      case 'CONTRACT_DELETED':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/30';
      case 'USER_CREATED':
      case 'USER_UPDATED':
      case 'USER_DELETED':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/30';
      case 'DEPT_CREATED':
      case 'DEPT_UPDATED':
      case 'DEPT_DELETED':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
          <History className="w-4 h-4" />
          <span>Security &amp; Audit Trail</span>
        </div>
        <h1 className="font-royal text-xl sm:text-2xl font-bold text-gold-gradient">
          User Activity &amp; Audit Logs
        </h1>
        <p className="text-xs text-stone-400">
          Immutable historical audit log tracking user changes, contract updates, and administrative events
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Search className="w-4 h-4 text-[#c5a059]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit details or user..."
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] py-2 pl-9 pr-3 text-xs text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* User selector */}
          <div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
            >
              <option value="ALL">All Hotel Staff</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#1c1815]">
                  {u.displayName} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          {/* Action category */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="CONTRACT_CREATED">Contract Created</option>
              <option value="CONTRACT_UPDATED">Contract Updated</option>
              <option value="CONTRACT_RENEWED">Contract Renewed</option>
              <option value="CONTRACT_DELETED">Contract Deleted</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="USER_DELETED">User Deleted</option>
              <option value="DEPT_CREATED">Department Created</option>
              <option value="DEPT_UPDATED">Department Updated</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
          <span>
            Displaying <strong className="text-stone-200">{filteredLogs.length}</strong> logged audit records
          </span>
          {(selectedUserId !== 'ALL' || selectedAction !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedUserId('ALL');
                setSelectedAction('ALL');
                setSearchQuery('');
              }}
              className="text-[#e6ca85] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] shadow-xl">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="bg-[#221b17] border-b border-[#c5a059]/20 uppercase tracking-wider text-[10px] text-[#e6ca85]">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User &amp; Department</th>
              <th className="px-4 py-3">Action Event</th>
              <th className="px-4 py-3">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No activity logs recorded matching criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedDate = dateObj.toLocaleDateString();
                const formattedTime = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={log.id} className="hover:bg-[#221b17] transition">
                    <td className="px-4 py-3 font-mono text-[11px] text-stone-400 whitespace-nowrap">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-stone-500">{formattedTime}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-[#e6ca85]">
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-200">{log.userName}</p>
                          <p className="text-[10px] text-[#c5a059]">{log.departmentName || 'Hotel Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-300 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
