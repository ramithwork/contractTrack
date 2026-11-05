import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, ShieldAlert, Check, X, FileText, Users } from 'lucide-react';
import { Department, Contract, User } from '../../types';
import { DepartmentService } from '../../services/departmentService';
import { ActivityLogService } from '../../services/activityLogService';

interface DepartmentManagerProps {
  departments: Department[];
  contracts: Contract[];
  users: User[];
  currentUser: User;
  onRefresh: () => Promise<void>;
}

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  contracts,
  users,
  currentUser,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [color, setColor] = useState('#D4AF37');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setHeadOfDepartment('');
    setColor('#D4AF37');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description);
    setHeadOfDepartment(dept.headOfDepartment || '');
    setColor(dept.color || '#D4AF37');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Department Name and Short Code are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingDept) {
        await DepartmentService.updateDepartment(editingDept.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          headOfDepartment: headOfDepartment.trim(),
          color,
        });
        await ActivityLogService.log(
          currentUser,
          'DEPT_UPDATED',
          `Updated hotel department '${name}' (${code})`,
          editingDept.id
        );
      } else {
        const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'dept';
        const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const id = `dept_${cleanCode}_${uniqueSuffix}`;

        await DepartmentService.createDepartment({
          id,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          headOfDepartment: headOfDepartment.trim(),
          color,
        });
        await ActivityLogService.log(
          currentUser,
          'DEPT_CREATED',
          `Created new hotel operational department '${name.trim()}' (${code.trim().toUpperCase()})`,
          id
        );
      }
      await onRefresh();
      setName('');
      setCode('');
      setDescription('');
      setHeadOfDepartment('');
      setColor('#D4AF37');
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    // Check if contracts are linked to this department
    const linkedContracts = contracts.filter((c) => c.departmentId === dept.id);
    if (linkedContracts.length > 0) {
      alert(
        `Cannot delete department '${dept.name}'. There are currently ${linkedContracts.length} active contract(s) assigned to this department. Please reassign those contracts first.`
      );
      return;
    }

    const linkedUsers = users.filter((u) => u.departmentId === dept.id);
    if (linkedUsers.length > 0) {
      alert(
        `Cannot delete department '${dept.name}'. There are currently ${linkedUsers.length} staff member(s) assigned to this department. Please reassign those users first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete department '${dept.name}'?`)) {
      return;
    }

    try {
      await DepartmentService.deleteDepartment(dept.id);
      await ActivityLogService.log(
        currentUser,
        'DEPT_DELETED',
        `Deleted hotel department '${dept.name}' (${dept.code})`,
        dept.id
      );
      await onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <Building2 className="w-4 h-4" />
            <span>Administrator Control Panel</span>
          </div>
          <h1 className="font-royal text-xl sm:text-2xl font-bold text-gold-gradient">
            Departmental Management
          </h1>
          <p className="text-xs text-stone-400">
            Configure operational hotel departments, assigned department heads, and contract management
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const deptContracts = contracts.filter((c) => c.departmentId === dept.id);
          const deptUsers = users.filter((u) => u.departmentId === dept.id);
          const activeCount = deptContracts.filter((c) => c.status === 'active').length;

          return (
            <div
              key={dept.id}
              className="relative flex flex-col justify-between rounded-2xl border border-[#c5a059]/25 bg-[#1b1613] p-5 shadow-lg hover:border-[#c5a059]/60 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: dept.color || '#d4af37' }}
                    />
                    <span className="font-mono text-xs font-bold text-[#f5e1a4] rounded bg-black/40 px-2 py-0.5 border border-[#c5a059]/30">
                      {dept.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="rounded-lg p-1.5 text-stone-400 hover:text-[#d4af37] hover:bg-stone-800 transition cursor-pointer"
                      title="Edit Department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="rounded-lg p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-royal text-base font-bold text-stone-100 mt-3">
                  {dept.name}
                </h3>
                <p className="mt-1 text-xs text-stone-400 line-clamp-2">
                  {dept.description || 'Hotel operational division'}
                </p>

                {dept.headOfDepartment && (
                  <div className="mt-2 text-xs text-stone-300">
                    <span className="text-stone-500">Head of Dept: </span>
                    <strong className="text-stone-200">{dept.headOfDepartment}</strong>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-[#221b17] p-2">
                  <span className="text-[10px] text-stone-400 uppercase">Contracts</span>
                  <p className="font-bold text-[#f5e1a4]">{deptContracts.length}</p>
                </div>
                <div className="rounded-lg bg-[#221b17] p-2">
                  <span className="text-[10px] text-stone-400 uppercase">Active</span>
                  <p className="font-bold text-emerald-400">{activeCount}</p>
                </div>
                <div className="rounded-lg bg-[#221b17] p-2">
                  <span className="text-[10px] text-stone-400 uppercase">Staff</span>
                  <p className="font-bold text-stone-200">{deptUsers.length}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#c5a059]/40 bg-[#1a1512] shadow-2xl p-6 text-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
              <h3 className="font-royal text-base font-bold text-gold-gradient">
                {editingDept ? 'Edit Hotel Department' : 'Create New Department'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Department Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Facilities & Engineering"
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Short Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ENG"
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs font-mono text-stone-100 uppercase focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Badge Color
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 rounded-lg border border-[#c5a059]/30 bg-[#241d18] p-0.5 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-stone-400">{color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Head of Department / Designated Lead
                </label>
                <input
                  type="text"
                  value={headOfDepartment}
                  onChange={(e) => setHeadOfDepartment(e.target.value)}
                  placeholder="e.g. Eng. Kithsiri Bandara"
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300">
                  Operational Scope &amp; Responsibilities
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of contracts managed under this department..."
                  className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-700 px-4 py-2 text-xs text-stone-400 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] px-4 py-2 text-xs font-bold text-[#14100e] hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
