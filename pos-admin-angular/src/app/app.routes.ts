import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './components/login.components/login.components';
import { LayoutComponents } from './components/layout.components/layout.components';
import { DashboardComponents } from './components/dashboard.components/dashboard.components';
import { PosComponent } from './components/pos.components/pos.components';
import { ReturnsComponents } from './components/returns.components/returns.components';
import { CategoriesComponents } from './components/categories.components/categories.components';
import { ProductsComponents } from './components/products.components/products.components';
import { InventoryComponents } from './components/inventory.components/inventory.components';
import { OrdersComponents } from './components/orders.components/orders.components';
import { RegisterComponent } from './components/register.components/register.components';
import { UserManagementComponent } from './components/user-management.components/user-management.components';
import { RolesComponents } from './components/roles.components/roles.components';
import { adminGuard } from './core/guards/admin.guard';
import { ReactHomeComponent } from './components/react-home.component';
import { ReactProfileComponent } from './components/react-profile.component';
import { ReactMyOrdersComponent } from './components/react-my-orders.component';
import { ReactCartComponent } from './components/react-cart.component';
import { ReactProductDetailsComponent } from './components/react-product-details.component';
import { ReactPaymentSuccessComponent } from './components/react-payment-success.component';

const STAFF = ['Admin', 'Cashier'];
const ADMIN_ONLY = ['Admin'];
const ALL_ROLES = ['Admin', 'Cashier', 'User'];

export const routes: Routes = [
  // 1. AUTHENTICATION PAGES (Full screen, no sidebar)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // 2. MAIN APPLICATION WITH ROLE-BASED SIDE MENU
  {
    path: '',
    component: LayoutComponents,
    children: [
      // Home page (accessible by all roles + guests, with side menu reflecting role)
      { path: '', component: ReactHomeComponent },
      { path: 'home', component: ReactHomeComponent },

      // Staff Store Management routes
      { path: 'dashboard', component: DashboardComponents, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'pos', component: PosComponent, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'returns', component: ReturnsComponents, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'categories', component: CategoriesComponents, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'products', component: ProductsComponents, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'inventory', component: InventoryComponents, canActivate: [authGuard], data: { roles: STAFF } },
      { path: 'orders', component: OrdersComponents, canActivate: [authGuard], data: { roles: STAFF } },

      // Account & Store pages
      { path: 'cart', component: ReactCartComponent },
      { path: 'payment-success', component: ReactPaymentSuccessComponent },
      { path: 'order-success', component: ReactPaymentSuccessComponent },
      { path: 'product/:id', component: ReactProductDetailsComponent },
      { path: 'product', component: ReactProductDetailsComponent },
      { path: 'profile', component: ReactProfileComponent, canActivate: [authGuard], data: { roles: ALL_ROLES } },
      { path: 'my-orders', component: ReactMyOrdersComponent, canActivate: [authGuard], data: { roles: ALL_ROLES } },

      // Finance & System (Admin ONLY)
      { path: 'roles', component: RolesComponents, canActivate: [authGuard], data: { roles: ADMIN_ONLY } },
      {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [adminGuard]
      }
    ],
  },
  { path: '**', redirectTo: '' },
];
