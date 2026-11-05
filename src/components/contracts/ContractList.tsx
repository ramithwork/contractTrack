import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  ShieldAlert,
  Tag,
} from 'lucide-react';
import { Contract, Department, User } from '../../types';
import { ContractService } from '../../services/contractService';

interface ContractListProps {
  contracts: Contract[];
  departments: Department[];
  currentUser: User | null;
  onSelectContract: (contract: Contract) => void;
  onOpenAddContract: () => void;
  initialFilter?: string;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  departments,
  currentUser,
  onSelectContract,
  onOpenAddContract,
  initialFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter === 'active' ? 'active' : 'ALL');
  const [selectedUrgency, setSelectedUrgency] = useState(initialFilter === 'urgent' ? 'urgent' : 'ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const allUniqueTags = Array.from(
    new Set(
      contracts.flatMap((c) =>
        Array.isArray(c.tags) && c.tags.length > 0
          ? c.tags
          : c.contractType
          ? [c.contractType]
          : []
      )
    )
  ).filter(Boolean);

  const filteredContracts = contracts.filter((c) => {
    // Search filter
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(c.tags) &&
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    // Department filter
    const matchesDept = selectedDept === 'ALL' || c.departmentId === selectedDept;

    // Tag filter
    const matchesTag =
      selectedTag === 'ALL' ||
      (Array.isArray(c.tags) && c.tags.includes(selectedTag)) ||
      c.contractType === selectedTag;

    // Status filter
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

    // Urgency filter
    const urgency = ContractService.calculateUrgency(c.renewalDate);
    const matchesUrgency =
      selectedUrgency === 'ALL' ||
      (selectedUrgency === 'urgent' && (urgency.level === 'urgent' || urgency.level === 'overdue')) ||
      (selectedUrgency === 'overdue' && urgency.level === 'overdue') ||
      (selectedUrgency === 'upcoming' && urgency.level === 'upcoming');

    return matchesSearch && matchesDept && matchesTag && matchesStatus && matchesUrgency;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-royal text-xl sm:text-2xl font-bold text-gold-gradient">
            Hotel Contract Registry
          </h1>
          <p className="text-xs text-stone-400">
            Track contracts, renewal obligations, and vendor SLAs across all departments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-[#c5a059]/30 bg-[#1e1713] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#d4af37] text-[#14100e]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#d4af37] text-[#14100e]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddContract}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD NEW CONTRACT</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Search className="w-4 h-4 text-[#c5a059]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts, vendors, tags..."
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] py-2 pl-9 pr-3 text-xs text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Department filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#1c1815]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Tags filter */}
          <div>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
            >
              <option value="ALL">All Contract Tags</option>
              {allUniqueTags.map((tag) => (
                <option key={tag} value={tag} className="bg-[#1c1815]">
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency filter */}
          <div>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
            >
              <option value="ALL">All Renewal Timelines</option>
              <option value="urgent">Urgent Renewals (≤ 14 Days &amp; Overdue)</option>
              <option value="overdue">Overdue Expired</option>
              <option value="upcoming">Upcoming (15–60 Days)</option>
            </select>
          </div>
        </div>

        {/* Quick pill filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-stone-400 font-semibold uppercase">Filter Status:</span>
          {['ALL', 'active', 'pending_renewal', 'under_review', 'renewed', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer capitalize ${
                selectedStatus === status
                  ? 'bg-[#c5a059]/30 text-[#f5e1a4] border border-[#c5a059]'
                  : 'bg-[#221b17] text-stone-400 hover:text-stone-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
          <span className="ml-auto text-xs text-stone-400">
            Showing <strong className="text-stone-200">{filteredContracts.length}</strong> of{' '}
            {contracts.length} contracts
          </span>
        </div>
      </div>

      {/* Contract Listing */}
      {filteredContracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c5a059]/30 bg-[#171310] p-12 text-center">
          <Building2 className="mx-auto w-10 h-10 text-[#c5a059]/40 mb-3" />
          <h3 className="font-royal text-base font-bold text-stone-300">
            No matching contracts found
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, department, or renewal urgency filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => {
            const urgency = ContractService.calculateUrgency(contract.renewalDate);
            return (
              <div
                key={contract.id}
                onClick={() => onSelectContract(contract)}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] p-5 shadow-lg hover:border-[#c5a059]/60 hover:bg-[#221b17] transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-[#e6ca85] border border-[#c5a059]/30">
                      {contract.contractNumber}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] border ${urgency.colorClass}`}>
                      {urgency.badgeLabel}
                    </span>
                  </div>

                  <h3 className="mt-3 font-royal text-sm font-bold text-stone-100 group-hover:text-gold-gradient transition-colors line-clamp-2">
                    {contract.title}
                  </h3>

                  <div className="mt-2 text-xs text-stone-400 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <span className="text-stone-500">Vendor:</span>
                      <strong className="text-stone-200 line-clamp-1">{contract.vendorName}</strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-stone-500">Dept:</span>
                      <span className="rounded bg-[#c5a059]/10 px-1.5 py-0.5 text-[10px] text-[#e6ca85]">
                        {contract.departmentName}
                      </span>
                    </p>
                  </div>

                  {/* Contract Tags */}
                  {Array.isArray(contract.tags) && contract.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {contract.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#c5a059]/15 border border-[#c5a059]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#f5e1a4]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#c5a059]" /> Renewal Due
                    </span>
                    <span className="font-semibold text-stone-200">
                      {contract.renewalDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Notice Period</span>
                    <span className="text-stone-300 font-mono">{contract.noticePeriodDays}d advance</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-stone-400">
                      Owner: <span className="text-stone-300 font-medium">{contract.creatorName}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#e6ca85] group-hover:underline">
                      Details &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] shadow-lg">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-[#221b17] border-b border-[#c5a059]/20 uppercase tracking-wider text-[10px] text-[#e6ca85]">
              <tr>
                <th className="px-4 py-3">Contract Ref</th>
                <th className="px-4 py-3">Title &amp; Vendor</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Renewal Target</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredContracts.map((contract) => {
                const urgency = ContractService.calculateUrgency(contract.renewalDate);
                return (
                  <tr
                    key={contract.id}
                    onClick={() => onSelectContract(contract)}
                    className="hover:bg-[#221b17] transition cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-[#f5e1a4]">
                      {contract.contractNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-stone-100">{contract.title}</p>
                      <p className="text-[11px] text-stone-400">{contract.vendorName}</p>
                      {Array.isArray(contract.tags) && contract.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {contract.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-[#c5a059]/15 border border-[#c5a059]/25 px-1.5 py-0.5 text-[9px] text-[#e6ca85]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#c5a059]/15 px-2 py-0.5 text-[10px] text-[#e6ca85]">
                        {contract.departmentName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-200">
                      {contract.renewalDate}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] border ${urgency.colorClass}`}>
                        {urgency.badgeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-300">
                      {contract.creatorName}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#e6ca85] hover:underline">
                      View
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
