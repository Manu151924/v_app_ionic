import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    return this.auth.isAuthenticatedSnapshot()
      ? true
      : this.router.createUrlTree(['/login']);
  }
}
