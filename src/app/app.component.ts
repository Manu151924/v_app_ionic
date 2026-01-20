import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { AlertController } from '@ionic/angular';
import { filter, Subscription } from 'rxjs';

import { Auth } from './shared/services/auth';
import { Crashlytics } from './shared/services/crashlytics';
import { Install } from './shared/services/install';
import { SessionTimeout } from './shared/services/session-timeout';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, FooterComponent, CommonModule],
})
export class AppComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private install = inject(Install);
  private alertCtrl = inject(AlertController);
  private sessionTimeout = inject(SessionTimeout);
  private crashlytics = inject(Crashlytics);

  private navSub?: Subscription;

  showFooter = false;

  private noInternetOpen = false;
  private serverDownOpen = false;
  private sessionExpiredOpen = false;

  async ngOnInit() {
    // ---------------- FOOTER ----------------
    this.updateFooter(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.updateFooter(e.urlAfterRedirects);
      });

    // ---------------- APK UPDATE ----------------
    await this.install.checkFreshInstall();

    // ---------------- APP RESUME ----------------
    this.handleAppResume();

    // ---------------- NETWORK ----------------
    const status = await Network.getStatus();
    if (!status.connected) this.showNoInternet();

    Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) {
        this.showNoInternet();
      }
    });

    // ---------------- UX ----------------
    this.enableKeyboardAdjustment();
    this.registerGlobalCrashHandlers();
    this.blurInputsOnNavigation();

    // ---------------- SESSION POPUPS ----------------
    this.sessionTimeout.getState().subscribe(async (state) => {
      const url = this.router.url;

      // 🔥 Never show session popups on login page
      if (url.startsWith('/login')) return;

      const status = await Network.getStatus();

      if (!status.connected) {
        this.showNoInternet();
        return;
      }

      if (state === 'SERVER_DOWN') this.showServerDown();
      if (state === 'SESSION_EXPIRED') this.showExpired();
    });
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  // ================= FOOTER =================

  private updateFooter(url: string) {
    this.showFooter =
      url.startsWith('/home') ||
      url.startsWith('/booking') ||
      url.startsWith('/delivery') ||
      url.startsWith('/account') ||
      url.startsWith('/inventory-route-modal');
  }

  // ================= APP RESUME =================

  private handleAppResume() {
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;

      const url = this.router.url;

      // 🔥 Do not restore session on login screen
      if (url.startsWith('/login')) return;

      const valid = await this.auth.restoreSession();
      if (!valid) {
        await this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });
  }

  // ================= GLOBAL ERROR =================

  private registerGlobalCrashHandlers() {
    window.addEventListener('unhandledrejection', (event: any) => {
      this.crashlytics.recordNonFatal(
        event.reason,
        'Unhandled Promise Rejection'
      );
    });

    window.addEventListener('error', (event: any) => {
      this.crashlytics.recordFatal(event.error || event.message);
    });
  }

  // ================= KEYBOARD =================

  private enableKeyboardAdjustment() {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    Keyboard.setScroll({ isDisabled: false });

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  }

  private blurInputsOnNavigation() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        (document.activeElement as HTMLElement)?.blur();
      }
    });
  }

  // ================= POPUPS =================

  async showNoInternet() {
    if (this.noInternetOpen) return;
    this.noInternetOpen = true;

    const a = await this.alertCtrl.create({
      header: 'No Internet',
      message: 'Please check your internet connection.',
      backdropDismiss: false,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.noInternetOpen = false;
          },
        },
      ],
    });

    await a.present();
  }

  async showServerDown() {
    if (this.serverDownOpen) return;
    this.serverDownOpen = true;

    const a = await this.alertCtrl.create({
      header: 'Server Under Maintenance',
      message: 'Our servers are temporarily unavailable.',
      buttons: [
        {
          text: 'OK',
          handler: () => (this.serverDownOpen = false),
        },
      ],
    });

    await a.present();
  }

  async showExpired() {
    if (this.sessionExpiredOpen) return;
    this.sessionExpiredOpen = true;

    const a = await this.alertCtrl.create({
      header: 'Session Expired',
      message: 'Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: async () => {
            this.sessionExpiredOpen = false;
            await this.auth.logout();
          },
        },
      ],
    });

    await a.present();
  }
}
