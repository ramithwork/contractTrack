import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { Contract, Department, User } from '../../types';
import { ContractService } from '../../services/contractService';

interface DashboardViewProps {
  contracts: Contract[];
  departments: Department[];
  currentUser: User | null;
  onSelectContract: (contract: Contract) => void;
  onOpenAddContract: () => void;
  onNavigateToContracts: (filter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contracts,
  departments,
  currentUser,
  onSelectContract,
  onOpenAddContract,
  onNavigateToContracts,
}) => {
  const activeContracts = contracts.filter((c) => c.status === 'active');

  // Urgency evaluations
  const contractsWithUrgency = contracts.map((c) => ({
    contract: c,
    urgency: ContractService.calculateUrgency(c.renewalDate),
  }));

  const overdueContracts = contractsWithUrgency.filter((item) => item.urgency.level === 'overdue');
  const urgentContracts = contractsWithUrgency.filter((item) => item.urgency.level === 'urgent');
  const upcomingContracts = contractsWithUrgency.filter((item) => item.urgency.level === 'upcoming');
  const goodStandingContracts = contractsWithUrgency.filter((item) => item.urgency.level === 'good_standing');

  // Contracts relevant to current user
  const myContracts = contracts.filter((c) => {
    if (!currentUser) return false;
    const isCreator = c.creatorId === currentUser.id;
    const isAssigned = Array.isArray(c.assignedUserIds) && c.assignedUserIds.includes(currentUser.id);
    return isCreator || isAssigned;
  });

  // Departmental breakdown stats (by contract count)
  const deptStats = departments.map((dept) => {
    const deptContracts = contracts.filter((c) => c.departmentId === dept.id && c.status === 'active');
    return {
      dept,
      count: deptContracts.length,
    };
  }).filter((s) => s.count > 0);

  // Next 5 upcoming renewal contracts sorted by renewal date
  const upcomingRenewalsSorted = [...contractsWithUrgency]
    .filter((item) => item.contract.status === 'active')
    .sort((a, b) => a.urgency.daysRemaining - b.urgency.daysRemaining)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c5a059]/30 bg-gradient-to-r from-[#1e1713] via-[#241c17] to-[#17120f] p-5 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gold-gradient">
              contractTrack Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              Real-time oversight of supplier contracts, renewal deadlines, notice window alerts, and departmental compliance for The Grand Kandyan Hotel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigateToContracts('urgent')}
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{overdueContracts.length + urgentContracts.length} Urgent Renewals</span>
            </button>
            <button
              onClick={onOpenAddContract}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <span>+ ADD NEW CONTRACT</span>
            </button>
          </div>
        </div>

        {/* Ambient background crest watermark */}
        <div className="pointer-events-none absolute -right-12 -bottom-16 w-64 h-64 opacity-5">
          <img src="/assets/aistudio/g_k_logo__2a517572.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Primary KPI Cards (3 columns, no committed spend) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Active Contracts */}
        <div
          onClick={() => onNavigateToContracts('active')}
          className="group rounded-2xl border border-[#c5a059]/25 bg-[#1b1613] p-4 sm:p-5 shadow-lg hover:border-[#c5a059]/60 hover:bg-[#231c18] transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Active Contracts
            </span>
            <div className="rounded-xl bg-emerald-950/60 p-2 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#f5e1a4]">
              {activeContracts.length}
            </span>
            <span className="text-[11px] text-stone-400">of {contracts.length} total</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400 flex items-center gap-1 group-hover:text-[#e6ca85]">
            <span>View all contracts</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Urgent & Overdue Renewals */}
        <div
          onClick={() => onNavigateToContracts('urgent')}
          className="group rounded-2xl border border-rose-500/30 bg-[#1b1613] p-4 sm:p-5 shadow-lg hover:border-rose-500/60 hover:bg-[#231c18] transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              Due Within 14 Days
            </span>
            <div className="rounded-xl bg-rose-950/60 p-2 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-300">
              {overdueContracts.length + urgentContracts.length}
            </span>
            {overdueContracts.length > 0 && (
              <span className="text-[11px] font-semibold text-rose-400">
                ({overdueContracts.length} Overdue)
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-rose-400/80 flex items-center gap-1">
            <span>Action required on notice period</span>
          </p>
        </div>

        {/* Approaching (15 to 60 Days) */}
        <div
          onClick={() => onNavigateToContracts('upcoming')}
          className="group rounded-2xl border border-sky-500/30 bg-[#1b1613] p-4 sm:p-5 shadow-lg hover:border-sky-500/60 hover:bg-[#231c18] transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              Renewals in 15–60 Days
            </span>
            <div className="rounded-xl bg-sky-950/60 p-2 text-sky-400 border border-sky-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-200">
              {upcomingContracts.length}
            </span>
            <span className="text-[11px] text-stone-400">contracts</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">
            Reminders scheduled for creator &amp; team
          </p>
        </div>
      </div>

      {/* Visual Renewal Timeline & Urgency Breakdown */}
      <div className="rounded-2xl border border-[#c5a059]/25 bg-[#1b1613] p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#c5a059]/15">
          <div>
            <h2 className="font-royal text-lg font-bold text-[#f5e1a4]">
              Upcoming Renewal Timeline &amp; Urgent Milestones
            </h2>
            <p className="text-xs text-stone-400">
              Contracts ordered by closest renewal deadline and notice period requirements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToContracts()}
              className="text-xs font-semibold text-[#e6ca85] hover:text-[#d4af37] flex items-center gap-1"
            >
              <span>View Full Registry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Renewal Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {upcomingRenewalsSorted.map(({ contract, urgency }) => {
            const isOverdue = urgency.level === 'overdue';
            const isUrgent = urgency.level === 'urgent';
            return (
              <div
                key={contract.id}
                onClick={() => onSelectContract(contract)}
                className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                  isOverdue
                    ? 'border-rose-500/50 bg-rose-950/20 hover:bg-rose-950/30'
                    : isUrgent
                    ? 'border-amber-500/50 bg-amber-950/20 hover:bg-amber-950/30'
                    : 'border-[#c5a059]/20 bg-[#221b17] hover:border-[#c5a059]/50 hover:bg-[#28211c]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-[#e6ca85] border border-[#c5a059]/30">
                      {contract.contractNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] border ${urgency.colorClass}`}
                    >
                      {urgency.badgeLabel}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-stone-100 line-clamp-1">
                    {contract.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Vendor: <strong className="text-stone-300">{contract.vendorName}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>Renewal Date</span>
                    </span>
                    <span className="font-semibold text-stone-200">
                      {contract.renewalDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-stone-400">
                    <span>Notice Period</span>
                    <span className="text-stone-300">{contract.noticePeriodDays} days</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-400">
                    <span>Department</span>
                    <span className="rounded bg-[#c5a059]/10 px-1.5 py-0.5 text-[10px] text-[#e6ca85]">
                      {contract.departmentName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-stone-400">
                      Owner: <span className="text-stone-300 font-medium">{contract.creatorName}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#c5a059] hover:underline flex items-center gap-1">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Layout: My Monitored Contracts + Departmental Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Monitored & Assigned Contracts */}
        <div className="rounded-2xl border border-[#c5a059]/25 bg-[#1b1613] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/15">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#d4af37]" />
              <div>
                <h3 className="font-royal text-base font-bold text-[#f5e1a4]">
                  My Monitored Contracts ({myContracts.length})
                </h3>
                <p className="text-[11px] text-stone-400">
                  Contracts you created or are assigned to for renewals
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {myContracts.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs">
                No contracts assigned directly to your user account yet.
              </div>
            ) : (
              myContracts.map((c) => {
                const urgency = ContractService.calculateUrgency(c.renewalDate);
                const isCreator = currentUser && c.creatorId === currentUser.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectContract(c)}
                    className="flex items-center justify-between rounded-xl border border-stone-800 bg-[#211a16] p-3 hover:border-[#c5a059]/50 transition cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-200 line-clamp-1">
                          {c.title}
                        </span>
                        {isCreator && (
                          <span className="rounded bg-[#c5a059]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#f5e1a4]">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400">
                        {c.vendorName} &bull; {c.departmentName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] border ${urgency.colorClass}`}>
                        {urgency.badgeLabel}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-0.5 font-mono">
                        {c.renewalDate}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Departmental Contract Distribution */}
        <div className="rounded-2xl border border-[#c5a059]/25 bg-[#1b1613] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/15">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#d4af37]" />
              <div>
                <h3 className="font-royal text-base font-bold text-[#f5e1a4]">
                  Departmental Contract Distribution
                </h3>
                <p className="text-[11px] text-stone-400">
                  Active contracts by hotel department
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-1">
            {deptStats.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs">
                No active departmental contracts recorded yet.
              </div>
            ) : (
              deptStats.map(({ dept, count }) => {
                const maxCount = Math.max(...deptStats.map((s) => s.count), 1);
                const percentage = Math.round((count / maxCount) * 100);
                return (
                  <div key={dept.id} className="rounded-xl bg-[#211a16] p-3 border border-stone-800">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: dept.color || '#d4af37' }}
                        />
                        <span className="font-bold text-stone-200">{dept.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-[#f5e1a4]">
                          {count} {count === 1 ? 'contract' : 'contracts'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: dept.color || '#d4af37',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
