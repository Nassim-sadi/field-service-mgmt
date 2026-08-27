import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { api } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type {
  AvgResolution,
  DashboardStats,
  OverTimeRow,
  PartsConsumption,
  Paginated,
  Sla,
  Technician,
  WorkloadRow,
} from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const statusColors: Record<string, string> = {
  new: '#3b82f6',
  assigned: '#6366f1',
  accepted: '#a855f7',
  in_progress: '#f59e0b',
  completed: '#10b981',
}

function useDashboard<T>(key: readonly unknown[], url: string) {
  return useQuery({ queryKey: key, queryFn: async () => (await api.get<T>(url)).data })
}

export function Dashboard() {
  const stats = useDashboard<DashboardStats>(queryKeys.dashboard.stats, '/dashboard/stats/')
  const workload = useDashboard<WorkloadRow[]>(queryKeys.dashboard.workload, '/dashboard/workload/')
  const sla = useDashboard<Sla>(queryKeys.dashboard.sla, '/dashboard/sla/')
  const avgRes = useDashboard<AvgResolution>(queryKeys.dashboard.avgResolution, '/dashboard/avg_resolution/')
  const parts = useDashboard<PartsConsumption[]>(queryKeys.dashboard.partsConsumption, '/dashboard/parts_consumption/')
  const overTime = useDashboard<OverTimeRow[]>(queryKeys.dashboard.overTime, '/dashboard/over_time/')

  const { data: technicians } = useQuery({
    queryKey: queryKeys.technicians,
    queryFn: async () => (await api.get<Paginated<Technician>>('/technicians/')).data.results,
  })

  const s = stats.data

  const statCards = [
    { label: 'Open tickets', value: s?.open_tickets, skeleton: true },
    { label: 'In progress', value: s?.in_progress },
    { label: 'Completed', value: s?.completed },
    { label: 'Technicians', value: s?.technicians },
    { label: 'Overdue', value: s?.overdue },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="Field service overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-semibold">{card.value ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Workload by technician</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="technician" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(overTime.data ?? []).map((row) => ({
                    name: row.status,
                    value: row.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {(overTime.data ?? []).map((row) => (
                    <Cell key={row.status} fill={statusColors[row.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Open" value={sla.data?.open_orders} loading={sla.isLoading} />
              <Metric label="On time" value={sla.data?.on_time} loading={sla.isLoading} />
              <Metric label="Breaches" value={sla.data?.breaches} loading={sla.isLoading} />
            </div>
            {avgRes.data?.avg_resolution_minutes != null && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="text-2xl font-semibold">
                  {Math.round(avgRes.data.avg_resolution_minutes)} min
                </div>
                <div className="text-sm text-muted-foreground">
                  Average resolution time
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parts consumption</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={parts.data?.map((p) => ({ name: p.part, quantity: p.quantity })) ?? []}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field technicians</CardTitle>
          </CardHeader>
          <CardContent className="h-72 overflow-hidden rounded-md">
            <MapContainer
              center={[28.0339, 1.6596]}
              zoom={5}
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {(technicians ?? [])
                .filter((tech) => tech.latitude != null && tech.longitude != null)
                .map((tech) => (
                  <Marker
                    key={tech.id}
                    position={[Number(tech.latitude), Number(tech.longitude)]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-medium">{tech.full_name || tech.username}</div>
                        <div className="text-muted-foreground">
                          {tech.open_work_orders} open order(s)
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  loading,
}: {
  label: string
  value?: number
  loading?: boolean
}) {
  return (
    <div>
      <div className="text-2xl font-semibold">
        {loading ? '…' : (value ?? 0)}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
