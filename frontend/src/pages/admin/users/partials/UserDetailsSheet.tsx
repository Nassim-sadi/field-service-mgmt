import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { RoleBadge } from '@/components/app/status-badge'
import type { User } from '@/lib/api/types'

export function UserDetailsSheet({
  user,
  open,
  onOpenChange,
}: {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{user.username}</SheetTitle>
          <SheetDescription>User details</SheetDescription>
        </SheetHeader>
        <dl className="space-y-3 text-sm">
          <Row label="Name" value={`${user.first_name} ${user.last_name}`.trim() || '—'} />
          <Row label="Email" value={user.email || '—'} />
          <Row
            label="Role"
            value={<RoleBadge role={user.role} />}
          />
          <Row label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
          <Row label="Staff" value={user.is_staff ? 'Yes' : 'No'} />
          <Row label="ID" value={String(user.id)} />
        </dl>
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
