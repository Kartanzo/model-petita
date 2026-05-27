import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Topbar } from '@/components/Topbar';
import { ToastProvider } from '@/components/Toast';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect('/login');
  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-bg">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 max-w-md sm:max-w-xl lg:max-w-[1200px] w-full mx-auto">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ToastProvider>
  );
}
