import { Component, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular/standalone';
import { NgxSpinnerModule } from "ngx-spinner";
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { AppStorageService } from 'src/app/shared/services/app-storage';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSpinnerModule],
})
export class AppComponent {

  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private storage = inject(AppStorageService);

  constructor() {
    this.bootstrapApp(); // must call first!
    this.enableKeyboardAdjustment();
    this.handleInputBlurOnNavigation();
    this.logViewportDetails();
  }

  /** MASTER INIT */
  private async bootstrapApp() {
    /** 🔥 Ensure Storage is fully initialized */
    await this.storage.waitUntilReady();

    /** Now splash logic is safe */
    this.handleSplashLoad();
  }

  /** Handle Splash Navigation AFTER storage ready */
  private async handleSplashLoad() {
    const gapMs = 5000;
    const now = Date.now();

    const lastSplashTime = await this.storage.get('lastSplashTime');

    if (!lastSplashTime || now - Number(lastSplashTime) > gapMs) {
      await this.storage.set('lastSplashTime', now.toString());
      this.router.navigateByUrl('/splash', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  /** Adjust for Native Keyboard Movement */
  private enableKeyboardAdjustment() {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-is-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-is-open');
    });
  }

  /** Debug Window Size */
  private logViewportDetails() {
    console.log("Viewport", window.innerWidth, window.innerHeight);
  }

  /** Blur active input when navigating */
  private handleInputBlurOnNavigation() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        (document.activeElement as HTMLElement)?.blur();
      }
    });
  }
}
