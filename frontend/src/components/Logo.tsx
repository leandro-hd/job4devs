import { Bell } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'lg';
}

export function Logo({ size = 'sm' }: LogoProps) {
  const isLarge = size === 'lg';

  return (
    <div className={`flex items-center gap-2 ${isLarge ? 'text-3xl' : 'text-lg'}`}>
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-white ${
          isLarge ? 'h-10 w-10' : 'h-7 w-7'
        }`}
      >
        <Bell className={isLarge ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={2.5} />
      </span>
      <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text font-bold text-transparent">
        job4devs
      </span>
    </div>
  );
}
