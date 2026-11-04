import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './components/login.components/login.components';
import { LayoutComponents } from './components/layout.components/layout.components';
import { DashboardComponents } from './components/dashboard.components/dashboard.components';
import { PosComponent } from './components/pos.components/pos.components';
import { CategoriesComponents } from './components/categories.components/categories.components';
import { ProductsComponents } from './components/products.components/products.components';
import { InventoryComponents } from './components/inventory.components/inventory.components';
import { OrdersComponents } from './components/orders.components/orders.components';
import { RegisterComponent } from './components/register.components/register.components';
import { UserManagementComponent } from './components/user-management.components/user-management.components';
import { RolesComponents } from './components/roles.components/roles.components';
import { adminGuard } from './core/guards/admin.guard';

const STAFF = ['Admin', 'POSOperator', 'Cashier', 'Salesman'];
const MANAGER = ['Admin', 'POSOperator'];
const STOCK = ['Admin', 'POSOperator', 'Cashier'];

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },  
  {
    path: '',
    component: LayoutComponents,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponents, canActivate: [authGuard] },
      { path: 'pos', component: PosComponent, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'categories', component: CategoriesComponents, canActivate: [authGuard], data: { roles: MANAGER } },
      { path: 'products', component: ProductsComponents, canActivate: [authGuard], data: { roles: MANAGER } },
      { path: 'inventory', component: InventoryComponents, canActivate: [authGuard], data: { roles: STOCK } },
      { path: 'orders', component: OrdersComponents, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'roles', component: RolesComponents, canActivate: [authGuard], data: { roles: ['Admin'] } },
      { 
        path: 'user-management', 
        component: UserManagementComponent,
        canActivate: [adminGuard]
      }
    ],
  },
  { path: '**', redirectTo: '' },
];
