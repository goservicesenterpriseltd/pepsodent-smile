'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isMobile } from '@/lib/share/share-utils';
import { MobileRestriction } from './MobileRestriction';

interface MobileRouteGuardProps {
  children: React.ReactNode;
}

/**
 * MobileRouteGuard restricts access to all routes except share routes on mobile devices.
 * Share routes (/share/[id]) are allowed on mobile for viewing and sharing results.
 */
export function MobileRouteGuard({ children }: MobileRouteGuardProps) {
  const pathname = usePathname();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobileDevice(isMobile());
  }, []);

  // Don't render anything until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Allow share routes on mobile
  const isShareRoute = pathname?.startsWith('/share/');

  // If mobile and not a share route, show restriction
  if (isMobileDevice && !isShareRoute) {
    return <MobileRestriction />;
  }

  // Otherwise, render children normally
  return <>{children}</>;
}

