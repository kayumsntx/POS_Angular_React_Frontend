import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponents } from './components/login.components/login.components';
import { LayoutComponents } from './components/layout.components/layout.components';
import { CategoriesComponents } from './components/categories.components/categories.components';
import { ProductsComponents } from './components/products.components/products.components';
import { InventoryComponents } from './components/inventory.components/inventory.components';
import { OrdersComponents } from './components/orders.components/orders.components';

const STAFF = ['Admin', 'POSOperator', 'Cashier', 'Salesman'];
const MANAGER = ['Admin', 'POSOperator'];
const STOCK = ['Admin', 'POSOperator', 'Cashier'];

export const routes: Routes = [
  { path: 'login', component: LoginComponents },
  {
    path: '',
    component: LayoutComponents,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      { path: 'categories', component: CategoriesComponents, canActivate: [authGuard], data: { roles: MANAGER } },
      { path: 'products', component: ProductsComponents, canActivate: [authGuard], data: { roles: MANAGER } },
      { path: 'inventory', component: InventoryComponents, canActivate: [authGuard], data: { roles: STOCK } },
      { path: 'orders', component: OrdersComponents, canActivate: [authGuard], data: { roles: STAFF } },
      
    ],
  },
  { path: '**', redirectTo: '' },
];
