import { useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { RoleBadge } from '@/components/app/status-badge'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2" />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials(displayName) || user?.username?.[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="font-medium">{displayName}</div>
            {user?.email && (
              <div className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </div>
            )}
            {user && <RoleBadge role={user.role} />}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/admin/account')}>
          <Settings />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
