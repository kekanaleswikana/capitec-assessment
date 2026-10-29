import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Book a space',
    loadComponent: () => import('./features/resources/resource-list.component').then(m => m.ResourceListComponent),
  },
  {
    path: 'book/:id',
    title: 'Choose a time',
    loadComponent: () => import('./features/booking/book.component').then(m => m.BookComponent),
  },
  {
    path: 'my-bookings',
    title: 'My bookings',
    loadComponent: () => import('./features/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent),
  },
  {
    path: 'admin/login',
    title: 'Admin login',
    loadComponent: () => import('./features/admin/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    title: 'Admin · Bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
