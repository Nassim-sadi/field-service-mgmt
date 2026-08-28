import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/RequireAuth'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/admin/Dashboard'
import { CustomersPage } from '@/pages/admin/customers'
import { SitesPage } from '@/pages/admin/sites'
import { AssetsPage } from '@/pages/admin/assets'
import { TechniciansPage } from '@/pages/admin/technicians'
import { PartsPage } from '@/pages/admin/parts'
import { WorkOrdersPage } from '@/pages/admin/work-orders'
import { ServiceReportsPage } from '@/pages/admin/service-reports'
import { UsersPage } from '@/pages/admin/users'
import { AccountPage } from '@/pages/admin/account'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="technicians" element={<TechniciansPage />} />
          <Route path="parts" element={<PartsPage />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="service-reports" element={<ServiceReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
