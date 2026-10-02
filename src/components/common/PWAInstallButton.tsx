import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF9F1C] to-[#FFB52E] px-3.5 py-2 text-xs font-black text-black shadow-md shadow-[#FF9F1C]/20 hover:from-[#FFA933] hover:to-[#FFBD42] transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
        Install App
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full border border-[#2D2D2D] bg-[#1E1E1E] px-3.5 py-1.5 text-xs font-bold text-white hover:border-[#FF9F1C]/40 transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#FFB52E]" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-[#242424] p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                <h3 className="text-base font-extrabold text-white">Install on iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-xs text-[#A7A7A7] leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> button in Safari toolbar.<br /><br />
                2. Scroll down and tap <strong className="text-[#FFB52E]">Add to Home Screen</strong>.<br /><br />
                3. Tap <strong className="text-white">Add</strong> in the top-right corner.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-2xl bg-[#202020] py-3 text-xs font-extrabold text-white hover:bg-[#282828] active:scale-95 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
