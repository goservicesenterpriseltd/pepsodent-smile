'use client';

import { Logo } from '@/components/ui/Logo';
import { observer } from 'mobx-react-lite';

export default observer(function ProcessingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 relative">
      {/* Logo Top Right */}
      <div className="absolute top-4 left-4 w-32 h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      
      <div className="text-center space-y-8">
        <div className="relative">
          <div className="w-32 h-32 border-8 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">😊</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-white">
            Analyzing Your Smile...
          </h2>
          <p className="text-white/80 text-lg">
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

