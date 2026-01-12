import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { AppStorageService } from '../../services/app-storage';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss']
})
export class SplashPage implements OnInit {

  fadeOut = false;

  constructor(
    private auth: Auth,
    private storage: AppStorageService,
    private router: Router
  ) {}

  async ngOnInit() {

    await this.storage.wait();

    const hasSession = await this.auth.restoreSession();

    await this.delay(2000);

    this.fadeOut = true;

    await this.delay(600);

    if (!hasSession) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } else {
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
