'use client';

import { Logo } from './Logo';

export function MobileRestriction() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo width={200} height={150} />
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Desktop Experience Required
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            The Pepsodent Smile Game is designed for desktop browsers to provide the best experience.
          </p>
        </div>

        {/* Icon/Illustration */}
        <div className="flex justify-center my-8">
          <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Share Page Note */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/20">
          <p className="text-gray-300 text-sm leading-relaxed">
            <strong className="text-white">Note:</strong> You can still view and share your results
            on mobile by visiting your share link directly.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}

