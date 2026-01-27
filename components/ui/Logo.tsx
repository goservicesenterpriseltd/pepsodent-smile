import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width = 120, height = 90 }: LogoProps) {
  return (
    <Link href="/welcome">
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
    </Link>
  );
}

