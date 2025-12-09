import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  async canActivate(): Promise<boolean> {
    await this.auth.preloadAuth();

    const isAuth = await this.auth.ensureAuthenticated();

    if (!isAuth) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return false;
    }

    return true;
  }
}
