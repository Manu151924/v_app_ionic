import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const valid = await this.auth.restoreSession();
    return valid ? true : this.router.createUrlTree(['/login']);
  }
}
