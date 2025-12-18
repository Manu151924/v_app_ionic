import { Component, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular/standalone';
import { NgxSpinnerModule } from "ngx-spinner";
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSpinnerModule],
})
export class AppComponent {

  private router = inject(Router);

  constructor() {
    this.enableKeyboardAdjustment();
    this.handleInputBlurOnNavigation();
    this.logViewportDetails();
  }

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
}
