'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width = 120, height = 90 }: LogoProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const logoContent = (
      <div className={`relative ${className}`}>
        <Image
          src="/logo.png"
          alt="Pepsodent Logo"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
  );

  if (isHomePage) {
    return (
      <div
        onClick={() => {
          window.location.reload();
        }}
        className="cursor-pointer"
      >
        {logoContent}
      </div>
    );
  }

  return <Link href="/">{logoContent}</Link>;
}

