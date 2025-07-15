import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { QueryProvider } from './query-provider';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), await cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.pyodide.org/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <QueryProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.user} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </QueryProvider>
    </>
  );
}
