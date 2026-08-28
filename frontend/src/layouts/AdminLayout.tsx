import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app/app-sidebar'
import { UserMenu } from '@/components/app/user-menu'
import { DEMO_MODE } from '@/lib/demo'

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        {DEMO_MODE && (
          <div className="bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-black">
            Demo mode — edits are local only, refresh restores original data.
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
