import { Routes } from '@angular/router';
import { AuthGuard } from './shared/services/auth.guard';
export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) 
  },
  { 
    path: 'home', 
    canActivate: [AuthGuard], 
    loadComponent: () => import('./home/home.page').then(m => m.HomePage) 
  },
  { 
    path: 'booking', 
    canActivate: [AuthGuard], 
    loadComponent: () => import('./pages/booking/booking.page').then(m => m.BookingPage) 
  },
  { 
    path: 'delivery', 
    canActivate: [AuthGuard], 
    loadComponent: () => import('./pages/delivery/delivery.page').then(m => m.DeliveryPage) 
  },
  { path: 
    'account', 
    canActivate: [AuthGuard], 
    loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage) 
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'splash',
    loadComponent: () => import('./shared/pages/splash/splash.page').then( m => m.SplashPage)
  },
  {
    path:'profile-details',
    loadComponent:() => import('./shared/pages/profile-details/profile-details.page').then( m => m.ProfileDetailsPage)
  }

];
