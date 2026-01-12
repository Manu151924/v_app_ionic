import { Routes } from '@angular/router';
import { AuthGuard } from './shared/services/auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },

  {
    path: 'splash',
    loadComponent: () =>
      import('./shared/pages/splash/splash.page').then(m => m.SplashPage)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then(m => m.LoginPage)
  },

  {
    path: 'profile-details',
    loadComponent: () =>
      import('./shared/pages/profile-details/profile-details.page')
        .then(m => m.ProfileDetailsPage)
  },

  {
    path: 'home',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage)
  },

  {
    path: 'booking',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/booking/booking.page').then(m => m.BookingPage)
  },

  {
    path: 'delivery',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/delivery/delivery.page').then(m => m.DeliveryPage)
  },

  {
    path: 'account',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/account/account.page').then(m => m.AccountPage)
  },

  {
    path: 'inventory-route-modal',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./shared/pages/inventory-route-modal/inventory-route-modal.page')
        .then(m => m.InventoryRouteModalPage)
  },

  {
    path: 'inventory-age-details',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./shared/pages/inventory-age-details/inventory-age-details.page')
        .then(m => m.InventoryAgeDetailsPage)
  },
];
