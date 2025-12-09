import { Component, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular/standalone';
import { NgxSpinnerModule } from "ngx-spinner";
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSpinnerModule],
})
export class AppComponent {
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  constructor() {
    this.enableKeyboardAdjustment();
    this.handleInputBlurOnNavigation();
    this.logViewportDetails();
    this.showSplashEveryThreeSeconds();
  }

  private enableKeyboardAdjustment() {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-is-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-is-open');
    });
  }

  private logViewportDetails() {
    console.log("Viewport", window.innerWidth, window.innerHeight);
  }

  private handleInputBlurOnNavigation() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        (document.activeElement as HTMLElement)?.blur();
      }
    });
  }

  private showSplashEveryThreeSeconds() {
    const lastShown = localStorage.getItem('lastSplashTime');
    const now = Date.now();
    const gap = 5000;

    if (!lastShown || now - +lastShown > gap) {
      localStorage.setItem('lastSplashTime', now.toString());
      this.router.navigateByUrl('/splash', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
