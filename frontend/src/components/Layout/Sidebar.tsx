import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/feed', label: 'Feed' },
  { to: '/settings', label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-48 border-r p-4">
      <div className="mb-6 text-lg font-semibold">job4devs</div>
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              cn('rounded-md px-3 py-2 text-sm hover:bg-muted', isActive && 'bg-muted font-medium')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
