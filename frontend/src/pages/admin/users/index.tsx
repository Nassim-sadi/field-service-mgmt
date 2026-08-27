import { useState } from 'react'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { User } from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { PaginatedFooter } from '@/components/app/paginated-footer'
import { EditAction, ViewAction } from '@/components/app/row-actions'
import { RoleBadge } from '@/components/app/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserCreateDialog } from './partials/UserCreateDialog'
import { UserEditDialog } from './partials/UserEditDialog'
import { UserDetailsSheet } from './partials/UserDetailsSheet'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [detailsUser, setDetailsUser] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<User>({
      url: '/users/',
      queryKey: [...queryKeys.users],
      search,
    })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage user accounts and roles"
        action={<UserCreateDialog />}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Search users…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                (data?.results ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                    </TableCell>
                    <TableCell>{user.email || '—'}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>{user.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewAction
                          onClick={() => {
                            setDetailsUser(user)
                            setDetailsOpen(true)
                          }}
                        />
                        <EditAction
                          onClick={() => {
                            setEditUser(user)
                            setEditOpen(true)
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (data?.results ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginatedFooter
            count={data?.count ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {editUser && (
        <UserEditDialog user={editUser} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {detailsUser && (
        <UserDetailsSheet
          user={detailsUser}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}
