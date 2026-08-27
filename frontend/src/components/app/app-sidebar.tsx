import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  Boxes,
  Wrench,
  Package,
  ClipboardList,
  FileText,
  UserCog,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth'

const managementNav = [
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/sites', label: 'Sites', icon: Building2 },
  { to: '/admin/assets', label: 'Assets', icon: Boxes },
  { to: '/admin/technicians', label: 'Technicians', icon: Wrench },
]

const serviceNav = [
  { to: '/admin/work-orders', label: 'Work Orders', icon: ClipboardList },
  { to: '/admin/service-reports', label: 'Service Reports', icon: FileText },
]

const inventoryNav = [{ to: '/admin/parts', label: 'Parts', icon: Package }]

export function AppSidebar() {
  const { isManagement, user } = useAuth()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </span>
          <div className="truncate text-sm font-semibold">FieldService</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<NavLink to="/admin" />} tooltip="Dashboard" isActive={false}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {isManagement && user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementNav.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton render={<NavLink to={to} />} tooltip={label}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Service</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {serviceNav.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton render={<NavLink to={to} />} tooltip={label}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isManagement && (
          <SidebarGroup>
            <SidebarGroupLabel>Inventory</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {inventoryNav.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton render={<NavLink to={to} />} tooltip={label}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
