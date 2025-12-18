import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true
})
export class SplashPage implements OnInit {

  fadeOut = false;

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  async ngOnInit(): Promise<void> {
    await this.auth.restoreSession();

    const isLoggedIn = this.auth.isAuthenticatedSnapshot();
    const target = isLoggedIn ? '/home' : '/login';

    setTimeout(() => {
      this.fadeOut = true;

      setTimeout(() => {
        this.router.navigateByUrl(target, { replaceUrl: true });
      }, 800);

    }, 1500);
  }
}
