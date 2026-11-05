import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress if already running in standalone mode
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#e6ca85] to-[#aa8222] px-3.5 py-1.5 text-xs font-semibold text-[#14100e] shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        title="Install The Grand Kandyan App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg border border-[#c5a059]/40 bg-[#1c1815]/90 px-3 py-1.5 text-xs font-medium text-[#e6ca85] hover:bg-[#28221d] transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#1c1815] border border-[#c5a059]/40 p-6 shadow-2xl text-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d4af37]" />
                  <h3 className="font-royal text-lg font-bold text-[#f5e1a4]">
                    Install on iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-300">
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c5a059]/20 text-xs font-bold text-[#d4af37]">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> icon in the Safari navigation bar.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c5a059]/20 text-xs font-bold text-[#d4af37]">
                    2
                  </span>
                  <span>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c5a059]/20 text-xs font-bold text-[#d4af37]">
                    3
                  </span>
                  <span>
                    Confirm <strong>Add</strong> to launch with native app feel & offline capabilities.
                  </span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8222] py-2.5 text-xs font-bold uppercase tracking-wider text-[#14100e] hover:brightness-110 transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
