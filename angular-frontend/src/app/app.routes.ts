import { Routes } from '@angular/router';
import { HomeComponent } from './features/landing/home';
import { LoginComponent } from './features/auth/login';
import { AdminLayoutComponent } from './features/admin/admin-layout';
import { authGuard } from './core/auth/auth.guard';
import { DashboardComponent } from './features/admin/dashboard';
import { CustomersComponent } from './features/admin/customers';
import { SitesComponent } from './features/admin/sites';
import { AssetsComponent } from './features/admin/assets';
import { TechniciansComponent } from './features/admin/technicians';
import { PartsComponent } from './features/admin/parts';
import { WorkOrdersComponent } from './features/admin/work-orders';
import { ServiceReportsComponent } from './features/admin/service-reports';
import { UsersComponent } from './features/admin/users';
import { AccountComponent } from './features/admin/account';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'sites', component: SitesComponent },
      { path: 'assets', component: AssetsComponent },
      { path: 'technicians', component: TechniciansComponent },
      { path: 'parts', component: PartsComponent },
      { path: 'work-orders', component: WorkOrdersComponent },
      { path: 'service-reports', component: ServiceReportsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'account', component: AccountComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
