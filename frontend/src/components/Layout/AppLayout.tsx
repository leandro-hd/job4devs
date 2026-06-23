import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-violet-50 via-background to-cyan-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
