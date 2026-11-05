import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  Users,
  Coins,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Paperclip,
  Share2,
  Bell,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { Contract, User } from '../../types';
import { ContractService } from '../../services/contractService';

interface ContractDetailDrawerProps {
  contract: Contract | null;
  onClose: () => void;
  onEdit: (contract: Contract) => void;
  onDelete: (id: string, title: string) => void;
  onRenew: (contract: Contract) => void;
  currentUser: User | null;
}

export const ContractDetailDrawer: React.FC<ContractDetailDrawerProps> = ({
  contract,
  onClose,
  onEdit,
  onDelete,
  onRenew,
  currentUser,
}) => {
  if (!contract) return null;

  const urgency = ContractService.calculateUrgency(contract.renewalDate);
  const isAdmin = currentUser?.role === 'admin';
  const isCreator = currentUser?.id === contract.creatorId;
  const isAssigned = Array.isArray(contract.assignedUserIds) && currentUser && contract.assignedUserIds.includes(currentUser.id);
  const canEdit = isAdmin || isCreator || isAssigned;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl h-full bg-[#1a1512] border-l border-[#c5a059]/30 shadow-2xl flex flex-col text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#c5a059]/20 bg-[#221b17] flex items-center justify-between">
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-black/50 px-2 py-0.5 text-xs font-mono text-[#f5e1a4] border border-[#c5a059]/30">
                {contract.contractNumber}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] border ${urgency.colorClass}`}>
                {urgency.badgeLabel}
              </span>
            </div>
            <h2 className="font-royal text-base sm:text-lg font-bold text-gold-gradient line-clamp-1">
              {contract.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#c5a059]/20 bg-[#211a16] p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Contract Tags
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {contract.tags && contract.tags.length > 0 ? (
                  contract.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#c5a059]/15 border border-[#c5a059]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#f5e1a4]"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-500 italic">No tags assigned</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#c5a059]/20 bg-[#211a16] p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Notice Requirement
              </span>
              <p className="mt-1 text-base font-bold text-stone-100">
                {contract.noticePeriodDays} Days
              </p>
              <p className="text-[10px] text-stone-400">Prior to renewal deadline</p>
            </div>
          </div>

          {/* Renewal Status Card */}
          <div className="rounded-xl border border-stone-800 bg-[#211a16] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Renewal Schedule</span>
              </h3>
              <span className="text-xs text-stone-400 capitalize">
                Status: <strong className="text-stone-200">{contract.status.replace('_', ' ')}</strong>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Effective Start Date</span>
                <span className="font-semibold text-stone-200">{contract.startDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Expiry End Date</span>
                <span className="font-semibold text-stone-200">{contract.endDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-[#f5e1a4] font-semibold">Renewal Decision Target</span>
                <span className="font-bold text-[#f5e1a4]">{contract.renewalDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-400">Auto-Renewal Clause</span>
                <span className="font-semibold text-stone-300">
                  {contract.autoRenewal ? 'Yes (Evergreen rollover)' : 'No (Requires explicit renewal)'}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="rounded-xl border border-stone-800 bg-[#211a16] p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Supplier / Contractor Information
            </h3>
            <p className="text-sm font-bold text-stone-100">{contract.vendorName}</p>
            {contract.vendorContact && (
              <p className="text-xs text-stone-300 font-mono">{contract.vendorContact}</p>
            )}
            <div className="pt-2 flex items-center gap-2 text-xs text-stone-400">
              <Building2 className="w-4 h-4 text-[#c5a059]" />
              <span>Department: </span>
              <span className="font-semibold text-[#e6ca85]">{contract.departmentName}</span>
            </div>
          </div>

          {/* Assigned Reviewers & Notification Targets */}
          <div className="rounded-xl border border-stone-800 bg-[#211a16] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Assigned Hotel Team</span>
              </h3>
              <span className="text-[11px] text-stone-400">
                Receiving Desktop &amp; Mobile Reminders
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-lg bg-[#28211b] p-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#c5a059] uppercase font-bold">Creator / Registered By</span>
                  <p className="font-semibold text-stone-200">{contract.creatorName}</p>
                </div>
                <span className="rounded bg-[#c5a059]/20 px-2 py-0.5 text-[9px] font-bold text-[#f5e1a4]">
                  Owner
                </span>
              </div>

              {contract.assignedUserNames && contract.assignedUserNames.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-stone-400">
                    Additional Reviewers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {contract.assignedUserNames.map((name, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-[#c5a059]/30 bg-[#241d18] px-2.5 py-1 text-xs text-stone-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reminder triggers */}
            <div className="pt-2 border-t border-stone-800">
              <span className="text-[10px] uppercase font-semibold text-stone-400 flex items-center gap-1">
                <Bell className="w-3 h-3 text-[#d4af37]" /> Scheduled Reminder Thresholds:
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {contract.reminderDays?.map((d) => (
                  <span
                    key={d}
                    className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-[#e6ca85] border border-stone-700"
                  >
                    T-{d} Days
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Key Terms & Notes */}
          {contract.keyTerms && (
            <div className="rounded-xl border border-stone-800 bg-[#211a16] p-4 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Key Terms &amp; Scope of Work
              </h3>
              <p className="text-xs text-stone-300 whitespace-pre-wrap leading-relaxed">
                {contract.keyTerms}
              </p>
            </div>
          )}

          {contract.notes && (
            <div className="rounded-xl border border-stone-800 bg-[#211a16] p-4 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Internal Administrative Remarks
              </h3>
              <p className="text-xs text-stone-300 whitespace-pre-wrap leading-relaxed">
                {contract.notes}
              </p>
            </div>
          )}

          {contract.attachmentName && (
            <div className="flex items-center gap-2 rounded-xl border border-[#c5a059]/20 bg-[#211a16] p-3 text-xs text-stone-300">
              <Paperclip className="w-4 h-4 text-[#c5a059]" />
              <div>
                <p className="font-semibold text-[#f5e1a4]">{contract.attachmentName}</p>
                <p className="text-[10px] text-stone-500">Document referenced in procurement registry</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#c5a059]/20 bg-[#201915] flex items-center justify-between gap-2">
          {isAdmin && (
            <button
              onClick={() => onDelete(contract.id, contract.title)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onRenew(contract)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Contract</span>
            </button>

            {canEdit && (
              <button
                onClick={() => onEdit(contract)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] px-4 py-2 text-xs font-bold text-[#14100e] hover:brightness-110 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
