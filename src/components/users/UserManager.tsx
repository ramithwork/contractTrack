import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  KeyRound,
  X,
  Building2,
  Phone,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { UserService } from '../../services/userService';
import { ActivityLogService } from '../../services/activityLogService';

interface UserManagerProps {
  users: User[];
  departments: Department[];
  currentUser: User;
  onRefresh: () => Promise<void>;
}

export const UserManager: React.FC<UserManagerProps> = ({
  users,
  departments,
  currentUser,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [departmentId, setDepartmentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setDisplayName('');
    setEmail('');
    setPassword('GrandKandyan@2026');
    setShowPassword(false);
    setRole('staff');
    setDepartmentId(departments[0]?.id || '');
    setPhoneNumber('');
    setStatus('active');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setDisplayName(u.displayName);
    setEmail(u.email || '');
    setPassword(''); // leave blank to keep existing
    setShowPassword(false);
    setRole(u.role);
    setDepartmentId(u.departmentId);
    setPhoneNumber(u.phoneNumber || '');
    setStatus(u.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setError('Username and Display Name are required.');
      return;
    }

    const effectiveDeptId = departmentId || (departments.length > 0 ? departments[0].id : '');
    if (!effectiveDeptId) {
      setError('Please create and assign a hotel department first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedDept = departments.find((d) => d.id === effectiveDeptId);
    const departmentName = selectedDept ? selectedDept.name : 'General';

    try {
      if (editingUser) {
        await UserService.updateUser(editingUser.id, {
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
          email: email.trim().toLowerCase() || '',
          role,
          departmentId: effectiveDeptId,
          departmentName,
          phoneNumber: phoneNumber.trim(),
          status,
          ...(password.trim() ? { plainPassword: password.trim() } : {}),
        });

        await ActivityLogService.log(
          currentUser,
          'USER_UPDATED',
          `Updated user account '${displayName}' (@${username}). Role: ${role}, Dept: ${departmentName}`,
          editingUser.id
        );
      } else {
        await UserService.createUser({
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
          email: email.trim().toLowerCase() || '',
          role,
          departmentId: effectiveDeptId,
          departmentName,
          phoneNumber: phoneNumber.trim(),
          status,
          plainPassword: password.trim() || 'GrandKandyan@2026',
        });

        await ActivityLogService.log(
          currentUser,
          'USER_CREATED',
          `Created user account '${displayName}' (@${username}) for ${departmentName} as ${role}`,
          username
        );
      }
      await onRefresh();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser.id) {
      alert('Security safeguard: You cannot delete your own logged-in administrator account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user account '${u.displayName}' (@${u.username})?`)) {
      return;
    }

    try {
      await UserService.deleteUser(u.id);
      await ActivityLogService.log(
        currentUser,
        'USER_DELETED',
        `Permanently deleted user account '${u.displayName}' (@${u.username})`,
        u.id
      );
      await onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <Shield className="w-4 h-4" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="font-royal text-xl sm:text-2xl font-bold text-gold-gradient">
            User Accounts &amp; Departmental Assignments
          </h1>
          <p className="text-xs text-stone-400">
            Only administrators can provision, edit, and revoke staff system credentials
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#c5a059]/20 bg-[#1b1613] shadow-xl">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="bg-[#221b17] border-b border-[#c5a059]/20 uppercase tracking-wider text-[10px] text-[#e6ca85]">
            <tr>
              <th className="px-4 py-3">Staff Member</th>
              <th className="px-4 py-3">Username &amp; Email</th>
              <th className="px-4 py-3">Assigned Department</th>
              <th className="px-4 py-3">Role Tier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <tr key={u.id} className="hover:bg-[#221b17] transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#8c6d2b] to-[#d4af37] text-xs font-bold text-[#14100e]">
                        {u.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-stone-100 flex items-center gap-1.5">
                          <span>{u.displayName}</span>
                          {isSelf && (
                            <span className="rounded bg-[#c5a059]/20 px-1.5 py-0.2 text-[9px] text-[#f5e1a4]">
                              (You)
                            </span>
                          )}
                        </p>
                        {u.phoneNumber && (
                          <p className="text-[10px] text-stone-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {u.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs text-stone-200">@{u.username}</p>
                    {u.email ? (
                      <p className="text-[10px] text-stone-400">{u.email}</p>
                    ) : (
                      <p className="text-[10px] text-stone-500 italic">No email</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 px-2 py-0.5 text-xs text-[#e6ca85]">
                      {u.departmentName}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        u.role === 'admin'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : u.role === 'manager'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      {u.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                      <span className="uppercase">{u.role}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        u.status === 'active'
                          ? 'bg-emerald-950/60 text-emerald-300'
                          : 'bg-stone-800 text-stone-500'
                      }`}
                    >
                      {u.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-stone-500" /> Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="rounded-lg p-1.5 text-stone-400 hover:text-[#d4af37] hover:bg-stone-800 transition"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="rounded-lg p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#c5a059]/40 bg-[#1a1512] shadow-2xl p-6 text-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
              <h3 className="font-royal text-base font-bold text-gold-gradient">
                {editingUser ? 'Edit User Credentials & Access' : 'Provision New Staff User'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="e.g. food.officer"
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs font-mono text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Priyantha Jayasuriya"
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Work Email <span className="text-stone-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff@grandkandyan.com"
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Hotel Phone / Ext <span className="text-stone-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +94 81 450 0045"
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Assign Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  >
                    {departments.length === 0 ? (
                      <option value="">No departments created yet</option>
                    ) : (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="bg-[#1c1815]">
                          {dept.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Access Role (RBAC) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="staff" className="bg-[#1c1815]">Staff / Officer</option>
                    <option value="manager" className="bg-[#1c1815]">Department Manager</option>
                    <option value="admin" className="bg-[#1c1815]">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    {editingUser ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUser ? 'Leave blank to keep current' : 'GrandKandyan@2026'}
                      className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 pr-10 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-200 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="mt-1 w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] px-3.5 py-2 text-xs text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
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
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
