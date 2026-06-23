import type { ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-background to-cyan-50 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Logo size="lg" />
        {children}
      </div>
    </div>
  );
}
