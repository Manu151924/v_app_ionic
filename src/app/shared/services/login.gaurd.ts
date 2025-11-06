import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const isLoggedIn = await this.auth.isLoggedIn();

    if (isLoggedIn) {
      this.router.navigateByUrl('/home', { replaceUrl: true });
      return false;
    }

    return true;
  }
}
