'use client';

import { Logo } from '@/components/ui/Logo';
import { observer } from 'mobx-react-lite';

export default observer(function ProcessingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 relative">
      {/* Logo Top Right */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-24 h-16 sm:w-32 sm:h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      
      <div className="text-center space-y-6 sm:space-y-8 pt-8 sm:pt-0">
        <div className="relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 border-8 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl sm:text-4xl">😊</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Analyzing Your Smile...
          </h2>
          <p className="text-white/80 text-sm sm:text-lg">
            Our AI is calculating your smile score
          </p>
        </div>

        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
});

