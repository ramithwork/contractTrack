import React, { useState } from 'react';
import { Lock, User as UserIcon, KeyRound, Eye, EyeOff } from 'lucide-react';
import { UserService } from '../../services/userService';
import { User } from '../../types';
import { getAssetUrl } from '../../utils/assets';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await UserService.authenticate(username, password);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#c5a059]/40 bg-[#1a1512] shadow-2xl p-6 sm:p-8 text-stone-200">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#c5a059]/40 bg-[#251e19] p-1.5 shadow-xl overflow-hidden">
            <img
              src={getAssetUrl('assets/contract_track_icon.png')}
              alt="contractTrack Icon"
              className="h-full w-full object-contain filter drop-shadow rounded-xl"
            />
          </div>
          <h2 className="font-royal text-2xl sm:text-3xl font-bold tracking-wider text-gold-gradient">
            contractTrack
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c5a059]/90 mt-1 font-royal">
            THE GRAND KANDYAN
          </p>
          <div className="mx-auto my-3 h-px w-24 bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent" />
          <p className="text-xs text-stone-400">
            Sign in to access contracts, renewal reminders, and departmental compliance
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Username & Password Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#e6ca85]">
              Username / Work Email
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="it@grandkandyan.com"
                className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] py-2.5 pl-9 pr-3 text-sm text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#e6ca85]">
              Password
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-[#c5a059]/30 bg-[#241d18] py-2.5 pl-9 pr-10 text-sm text-stone-100 placeholder-stone-500 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] py-3 text-xs font-bold uppercase tracking-wider text-[#14100e] shadow-lg shadow-[#c5a059]/20 hover:brightness-110 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#14100e] border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Sign In to contractTrack
              </span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#c5a059]/20 text-center">
          <p className="text-[11px] text-stone-400">
            For credential reset or access requests, contact IT Systems Administration.
          </p>
        </div>
      </div>
    </div>
  );
};
