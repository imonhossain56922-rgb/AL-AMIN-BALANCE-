import React, { useEffect, useState } from 'react';

interface LoadingSplashProps {
  onFinish: () => void;
  durationMs?: number;
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({
  onFinish,
  durationMs = 900,
}) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, durationMs - 250);

    const endTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08090C] transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
        {/* Animated Brand Monogram */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/30 to-emerald-400/10 p-0.5 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#10131A] rounded-[22px] flex items-center justify-center">
              <span className="text-emerald-400 font-black text-3xl tracking-wider">
                AB
              </span>
            </div>
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-emerald-500/15 opacity-40 blur-xl animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-white tracking-[0.2em]">ALARMENS BALANCE</h1>
        <p className="text-xs font-semibold text-emerald-400 mt-2 tracking-widest uppercase">
          Personal Money Manager
        </p>

        {/* Fintech Progress Accent */}
        <div className="w-32 h-1 bg-[#1A1E29] rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full animate-[progress_0.9s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
