import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Building2,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Clock,
} from 'lucide-react';
import { Department, Contract, User } from '../../types';
import { ContractService } from '../../services/contractService';

interface DepartmentReportsProps {
  departments: Department[];
  contracts: Contract[];
  users: User[];
}

export const DepartmentReports: React.FC<DepartmentReportsProps> = ({
  departments,
  contracts,
  users,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Compute departmental report metrics (no committed spend)
  const reports = departments.map((dept) => {
    const deptContracts = contracts.filter((c) => c.departmentId === dept.id);
    const activeContracts = deptContracts.filter((c) => c.status === 'active');
    const expiredContracts = deptContracts.filter((c) => c.status === 'expired');
    const pendingRenewal = deptContracts.filter((c) => c.status === 'pending_renewal');

    let upcoming30Days = 0;
    let upcoming90Days = 0;

    activeContracts.forEach((c) => {
      const urgency = ContractService.calculateUrgency(c.renewalDate);
      if (urgency.daysRemaining >= 0 && urgency.daysRemaining <= 30) {
        upcoming30Days++;
      }
      if (urgency.daysRemaining >= 0 && urgency.daysRemaining <= 90) {
        upcoming90Days++;
      }
    });

    const assignedStaff = users.filter((u) => u.departmentId === dept.id).length;

    return {
      department: dept,
      totalContracts: deptContracts.length,
      activeContracts: activeContracts.length,
      pendingRenewal: pendingRenewal.length,
      expiredContracts: expiredContracts.length,
      upcomingRenewals30Days: upcoming30Days,
      upcomingRenewals90Days: upcoming90Days,
      assignedStaffCount: assignedStaff,
    };
  });

  const totalHotelActiveContracts = reports.reduce((s, r) => s + r.activeContracts, 0);
  const totalUpcoming30Days = reports.reduce((s, r) => s + r.upcomingRenewals30Days, 0);
  const totalUpcoming90Days = reports.reduce((s, r) => s + r.upcomingRenewals90Days, 0);

  const displayedReports =
    selectedDeptId === 'ALL'
      ? reports
      : reports.filter((r) => r.department.id === selectedDeptId);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Department Name',
      'Dept Code',
      'Head of Department',
      'Total Contracts',
      'Active Contracts',
      'Renewals in 30 Days',
      'Renewals in 90 Days',
      'Assigned Staff',
    ];

    const rows = displayedReports.map((r) => [
      `"${r.department.name}"`,
      r.department.code,
      `"${r.department.headOfDepartment || 'Unassigned'}"`,
      r.totalContracts,
      r.activeContracts,
      r.upcomingRenewals30Days,
      r.upcomingRenewals90Days,
      r.assignedStaffCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GrandKandyan_Departmental_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <BarChart3 className="w-4 h-4" />
            <span>Contract Analytics &amp; Compliance</span>
          </div>
          <h1 className="font-royal text-xl sm:text-2xl font-bold text-gold-gradient">
            Departmental Contract Reports
          </h1>
          <p className="text-xs text-stone-400">
            Generate hotel contract summaries, departmental oversight, and renewal timelines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-[#c5a059]/40 bg-[#1e1713] px-3.5 py-2 text-xs font-semibold text-[#f5e1a4] hover:bg-[#28211c] transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#d4af37]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Aggregates (No spend or value metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#c5a059]/25 bg-[#1b1613] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Recorded Contracts
            </span>
            <div className="rounded-xl bg-[#c5a059]/20 p-2 text-[#d4af37] border border-[#c5a059]/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#f5e1a4]">
            {contracts.length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Across all {departments.length} hotel departments</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-[#1b1613] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Active Contracts
            </span>
            <div className="rounded-xl bg-emerald-950/60 p-2 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {totalHotelActiveContracts}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Operational supplier contracts</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-[#1b1613] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              Renewals Due ≤ 30 Days
            </span>
            <div className="rounded-xl bg-rose-950/60 p-2 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-300">
            {totalUpcoming30Days}
          </div>
          <p className="text-[11px] text-rose-400/80 mt-1">Contracts requiring immediate renegotiation</p>
        </div>
      </div>

      {/* Filter by Department */}
      <div className="flex items-center justify-between rounded-xl border border-stone-800 bg-[#1b1613] p-3 text-xs">
        <div className="flex items-center gap-2 text-stone-400">
          <span>Filter Report by Department:</span>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="rounded-lg border border-[#c5a059]/30 bg-[#241d18] px-2.5 py-1 text-xs text-stone-200 focus:outline-none"
          >
            <option value="ALL">All Departments (Consolidated)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#1c1815]">
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-stone-400 text-[11px]">
          Generated on: {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Department Report Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] shadow-xl">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="bg-[#221b17] border-b border-[#c5a059]/20 uppercase tracking-wider text-[10px] text-[#e6ca85]">
            <tr>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Head of Dept</th>
              <th className="px-4 py-3.5 text-center">Total Contracts</th>
              <th className="px-4 py-3.5 text-center">Active Contracts</th>
              <th className="px-4 py-3.5 text-center">Due ≤ 30 Days</th>
              <th className="px-4 py-3.5 text-center">Due ≤ 90 Days</th>
              <th className="px-4 py-3.5 text-right">Assigned Personnel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {displayedReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  No departments found.
                </td>
              </tr>
            ) : (
              displayedReports.map((r) => {
                return (
                  <tr key={r.department.id} className="hover:bg-[#221b17] transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: r.department.color || '#d4af37' }}
                        />
                        <div>
                          <p className="font-bold text-stone-100">{r.department.name}</p>
                          <span className="font-mono text-[10px] text-[#c5a059]">
                            Code: {r.department.code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-stone-300">
                      {r.department.headOfDepartment || 'Unassigned'}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-stone-200">
                      {r.totalContracts}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-[#f5e1a4]">
                      {r.activeContracts}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.upcomingRenewals30Days > 0 ? (
                        <span className="rounded-full bg-rose-950/70 border border-rose-500/40 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                          {r.upcomingRenewals30Days} urgent
                        </span>
                      ) : (
                        <span className="text-stone-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.upcomingRenewals90Days > 0 ? (
                        <span className="rounded-full bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                          {r.upcomingRenewals90Days}
                        </span>
                      ) : (
                        <span className="text-stone-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#241d18] px-2.5 py-1 text-xs text-stone-300 border border-stone-800">
                        <Users className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>{r.assignedStaffCount} users</span>
                      </span>
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
