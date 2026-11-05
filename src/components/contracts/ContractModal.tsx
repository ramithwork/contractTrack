import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building2,
  Users,
  Bell,
  Check,
  AlertCircle,
  Sparkles,
  Paperclip,
  Tag,
  Plus,
} from 'lucide-react';
import { Contract, Department, User } from '../../types';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingContract?: Contract | null;
  departments: Department[];
  allUsers: User[];
  currentUser: User;
}

const PRESET_TAGS = [
  'SLA',
  'Annual Maintenance (AMC)',
  'Software & IT',
  'F&B Supply',
  'Housekeeping',
  'Linen & Laundry',
  'HVAC & Engineering',
  'Elevator Maintenance',
  'Security & Safety',
  'Audio/Visual',
  'Banqueting & Events',
  'Pest Control',
  'Fire Safety',
  'Water Treatment',
  'Telecom & Fiber',
  'Legal & Property',
];

const DEFAULT_REMINDER_OPTIONS = [90, 60, 45, 30, 14, 7, 1];

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContract,
  departments,
  allUsers,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [value, setValue] = useState<number | ''>('');
  const [currency, setCurrency] = useState('LKR');
  const [status, setStatus] = useState<Contract['status']>('active');
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([60, 30, 14, 7, 1]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [keyTerms, setKeyTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingContract) {
      setTitle(editingContract.title);
      setContractNumber(editingContract.contractNumber);
      setVendorName(editingContract.vendorName);
      setVendorContact(editingContract.vendorContact || '');
      setDepartmentId(editingContract.departmentId);
      const initialTags =
        editingContract.tags && editingContract.tags.length > 0
          ? editingContract.tags
          : editingContract.contractType
          ? [editingContract.contractType]
          : [];
      setTags(initialTags);
      setTagInput('');
      setStartDate(editingContract.startDate);
      setEndDate(editingContract.endDate);
      setRenewalDate(editingContract.renewalDate);
      setNoticePeriodDays(editingContract.noticePeriodDays || 30);
      setValue(editingContract.value !== undefined ? editingContract.value : '');
      setCurrency(editingContract.currency || 'LKR');
      setStatus(editingContract.status || 'active');
      setAutoRenewal(!!editingContract.autoRenewal);
      setReminderDays(editingContract.reminderDays || [30, 14, 7, 1]);
      setAssignedUserIds(editingContract.assignedUserIds || []);
      setKeyTerms(editingContract.keyTerms || '');
      setNotes(editingContract.notes || '');
      setAttachmentName(editingContract.attachmentName || '');
    } else {
      // Default new contract
      setTitle('');
      setVendorName('');
      setVendorContact('');
      const defaultDept = departments[0]?.id || '';
      setDepartmentId(defaultDept);
      setTags(['SLA']);
      setTagInput('');

      const today = new Date();
      const inOneYear = new Date();
      inOneYear.setFullYear(today.getFullYear() + 1);

      const yyyy = today.toISOString().split('T')[0];
      const yyyyNext = inOneYear.toISOString().split('T')[0];

      setStartDate(yyyy);
      setEndDate(yyyyNext);
      setRenewalDate(yyyyNext);
      setNoticePeriodDays(30);
      setValue('');
      setCurrency('LKR');
      setStatus('active');
      setAutoRenewal(false);
      setReminderDays([60, 30, 14, 7, 1]);
      setAssignedUserIds([]);
      setKeyTerms('');
      setNotes('');
      setAttachmentName('');

      // Generate suggested contract number
      generateContractNumber(defaultDept);
    }
  }, [editingContract, departments, isOpen]);

  const generateContractNumber = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    const code = dept ? dept.code : 'GEN';
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    setContractNumber(`GK-${code}-${year}-${randomSeq}`);
  };

  const handleDepartmentChange = (deptId: string) => {
    setDepartmentId(deptId);
    if (!editingContract) {
      generateContractNumber(deptId);
    }
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const toggleUserAssignment = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== userId));
    } else {
      setAssignedUserIds([...assignedUserIds, userId]);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      handleAddTag(tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contractNumber.trim() || !vendorName.trim()) {
      setError('Title, Contract Reference Number, and Vendor Name are required.');
      return;
    }
    if (!departmentId) {
      setError('Please select an owning hotel department.');
      return;
    }
    if (!renewalDate) {
      setError('Please specify a Renewal Decision Date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedDept = departments.find((d) => d.id === departmentId);
    const assignedUserNames = assignedUserIds.map((uid) => {
      const u = allUsers.find((user) => user.id === uid);
      return u ? u.displayName : uid;
    });

    try {
      const contractPayload: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        contractNumber: contractNumber.trim().toUpperCase(),
        vendorName: vendorName.trim(),
        vendorContact: vendorContact.trim(),
        departmentId,
        departmentName: selectedDept ? selectedDept.name : 'General',
        tags: tags.length > 0 ? tags : ['General'],
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || renewalDate,
        renewalDate,
        noticePeriodDays: Number(noticePeriodDays) || 30,
        status,
        autoRenewal,
        reminderDays,
        assignedUserIds,
        assignedUserNames,
        creatorId: editingContract ? editingContract.creatorId : currentUser.id,
        creatorName: editingContract ? editingContract.creatorName : currentUser.displayName,
        keyTerms: keyTerms.trim(),
        notes: notes.trim(),
      };

      if (value !== '' && !isNaN(Number(value))) {
        contractPayload.value = Number(value);
        contractPayload.currency = currency || 'LKR';
      }
      if (attachmentName.trim()) {
        contractPayload.attachmentName = attachmentName.trim();
      }

      await onSave(contractPayload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#c5a059]/40 bg-[#1a1512] shadow-2xl text-stone-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c5a059]/20 bg-[#221b17] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#c5a059]/20 p-2 text-[#d4af37] border border-[#c5a059]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-royal text-lg font-bold text-gold-gradient">
                {editingContract ? 'Edit Contract Details' : 'Register New Hotel Contract'}
              </h2>
              <p className="text-xs text-stone-400 font-royal">
                THE GRAND KANDYAN &bull; contractTrack
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Contract Basics */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] border-b border-[#c5a059]/20 pb-1">
              1. Contract Identification
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-300">
                Contract Title / Scope <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Otis Panoramic Lift Annual Maintenance SLA"
                className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-300">
                    Contract Tracking Ref <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => generateContractNumber(departmentId)}
                    className="text-[10px] text-[#e6ca85] hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="e.g. GK-ENG-2026-014"
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm font-mono text-stone-100 uppercase focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Owning Department <span className="text-rose-400">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-[#1c1815]">
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Vendor / Contractor Company <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Otis Elevator Company Lanka"
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Vendor Contact (Phone / Email)
                </label>
                <input
                  type="text"
                  value={vendorContact}
                  onChange={(e) => setVendorContact(e.target.value)}
                  placeholder="e.g. +94 11 268 7700 / service@otis.lk"
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Contract Value <span className="text-[10px] text-stone-500 font-normal">(Optional)</span>
                </label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-24 rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-2.5 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="LKR">LKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Optional value"
                    className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-sm font-semibold text-[#f5e1a4] placeholder-stone-600 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Lifecycle Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Contract['status'])}
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="pending_renewal">Pending Renewal</option>
                  <option value="under_review">Under Review</option>
                  <option value="renewed">Renewed</option>
                  <option value="terminated">Terminated</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Contract Tags (Replaces Category) */}
            <div className="rounded-xl border border-[#c5a059]/30 bg-[#201915] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#f5e1a4]">
                  <Tag className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Contract Tags</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  {tags.length} assigned
                </span>
              </div>

              {/* Tag Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 text-xs">
                    #
                  </span>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    placeholder="Type tag name and press Enter or click Add..."
                    className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] py-2 pl-7 pr-3 text-xs text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="flex items-center gap-1 rounded-xl border border-[#c5a059]/40 bg-[#c5a059]/20 px-3.5 py-2 text-xs font-semibold text-[#f5e1a4] hover:bg-[#c5a059]/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Selected Tags Chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/50 px-2.5 py-1 text-xs font-medium text-[#f5e1a4]"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded hover:bg-[#c5a059]/30 p-0.5 text-stone-400 hover:text-white transition cursor-pointer"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Common Tags */}
              <div className="pt-1">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1.5 font-semibold">
                  Hotel Contract Tags:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((preset) => {
                    const isSelected = tags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleToggleTag(preset)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37] text-[#14100e] font-semibold shadow-sm'
                            : 'border border-stone-700 bg-[#241d18] text-stone-400 hover:text-stone-200 hover:border-stone-600'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}#{preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Dates, Renewal & Reminders */}
          <div className="space-y-4 pt-3 border-t border-[#c5a059]/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] border-b border-[#c5a059]/20 pb-1">
              2. Renewal Timeline &amp; Notification Triggers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f5e1a4]">
                  Renewal Decision Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d4af37] bg-[#2a221d] px-3 py-2 text-sm font-semibold text-[#f5e1a4] focus:outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Notice Period Required (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Days in advance you must notify vendor prior to renewal/cancellation
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={autoRenewal}
                  onChange={(e) => setAutoRenewal(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-600 text-[#d4af37] focus:ring-[#d4af37]"
                />
                <label htmlFor="autoRenewCheck" className="text-xs font-medium text-stone-200">
                  Contract has Evergreen / Auto-Renewal Clause
                </label>
              </div>
            </div>

            {/* Notification Reminders */}
            <div>
              <label className="block text-xs font-semibold text-stone-300">
                Desktop &amp; Mobile Renewal Reminder Alerts (Days Before Renewal)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULT_REMINDER_OPTIONS.map((days) => {
                  const isSelected = reminderDays.includes(days);
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => toggleReminderDay(days)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#d4af37] text-[#14100e] shadow-md shadow-[#d4af37]/20'
                          : 'border border-stone-700 bg-[#241d18] text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{days} Days Before</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-stone-400">
                Scheduled notifications fire on these days to the contract creator and assigned staff.
              </p>
            </div>
          </div>

          {/* Section 3: Assign Other Users */}
          <div className="space-y-3 pt-3 border-t border-[#c5a059]/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                  3. Assign Hotel Team Members
                </h3>
                <p className="text-[11px] text-stone-400">
                  Assigned staff will be granted access to view this contract and receive desktop &amp; mobile renewal reminders.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#f5e1a4]">
                {assignedUserIds.length} Assigned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto rounded-xl border border-stone-800 bg-[#171310] p-3">
              {allUsers.map((user) => {
                const isAssigned = assignedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserAssignment(user.id)}
                    className={`flex items-center justify-between rounded-lg p-2 transition cursor-pointer ${
                      isAssigned
                        ? 'border border-[#d4af37]/50 bg-[#29211b]'
                        : 'border border-transparent bg-[#201915] hover:bg-[#261f1a]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-200">{user.displayName}</p>
                      <p className="text-[10px] text-stone-400">
                        {user.departmentName} &bull; <span className="uppercase">{user.role}</span>
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        isAssigned
                          ? 'bg-[#d4af37] border-[#d4af37] text-[#14100e]'
                          : 'border-stone-600'
                      }`}
                    >
                      {isAssigned && <Check className="w-3.5 h-3.5 font-bold" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Key Terms & Notes */}
          <div className="space-y-4 pt-3 border-t border-[#c5a059]/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] border-b border-[#c5a059]/20 pb-1">
              4. Key Terms &amp; Reference Documents
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-300">
                Key Obligations &amp; Deliverables
              </label>
              <textarea
                rows={2}
                value={keyTerms}
                onChange={(e) => setKeyTerms(e.target.value)}
                placeholder="e.g. Monthly maintenance inspections, 24/7 emergency response SLA under 45 mins, spare parts warranty..."
                className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Internal Notes / Negotiation Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discussed renewal discounts with General Manager. Requesting 8% reduction for 2-year extension."
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Attachment / Contract Document Reference
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <Paperclip className="w-4 h-4 text-[#c5a059]" />
                  </div>
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="e.g. Signed_GK_Otis_SLA_2026.pdf"
                    className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] py-2 pl-9 pr-3 text-xs text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-stone-400">
                  Digital archive file or procurement docket identifier
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#c5a059]/20 bg-[#201915] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-700 bg-stone-800/80 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-lg shadow-[#c5a059]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <span>{editingContract ? 'Save Changes' : '+ ADD NEW CONTRACT'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
