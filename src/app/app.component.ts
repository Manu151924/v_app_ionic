import { Component, inject, OnInit, ViewChild } from '@angular/core';

import { Router, NavigationStart } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform, AlertController } from '@ionic/angular';

import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { EdgeToEdge  } from '@capawesome/capacitor-android-edge-to-edge-support';


import { Network } from '@capacitor/network';

import { CommonModule } from '@angular/common';

import { Auth } from './shared/services/auth';
import { Crashlytics } from './shared/services/crashlytics';
import { Install } from './shared/services/install';
import { SessionTimeout } from './shared/services/session-timeout';
import { Root } from './shared/services/root';
import {
  ModalController,
  ActionSheetController,
  LoadingController,
  ToastController,
  PopoverController,

} from '@ionic/angular/standalone';
import { PlayIntegrityService } from './shared/services/play-integrity';

/* ================= SECURITY PLUGIN ================= */

interface SecurityPlugin {
  performChecks(): Promise<{
    status: string;
    reason?: string;
  }>;
}

const Security = registerPlugin<SecurityPlugin>('Security');

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, CommonModule],
})
export class AppComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private install = inject(Install);
  private alertCtrl = inject(AlertController);
  private sessionTimeout = inject(SessionTimeout);
  private crashlytics = inject(Crashlytics);
  private platform = inject(Platform);
  private root = inject(Root);
  private modalCtrl= inject(ModalController);
  private popoverCtrl = inject(PopoverController);
  private actionSheetCtrl = inject(ActionSheetController);
  private loadingCtrl =inject(LoadingController);
  private toastCtrl =inject(ToastController);
  private integrity = inject(PlayIntegrityService);


  @ViewChild(IonRouterOutlet, { static: true })
  routerOutlet!: IonRouterOutlet;

  /* ================= FOOTER VISIBILITY ================= */

  get shouldShowFooter(): boolean {
    const url = this.router.url;

    const footerRoutes = [
      '/home',
      '/booking',
      '/delivery',
      '/account',
      '/inventory-route-modal',
    ];

    return footerRoutes.some((route) => url.includes(route));
  }

  /* ================= INIT ================= */

  async ngOnInit() {
    /* ---------- SECURITY ---------- */
    await this.platform.ready();
      await this.runRootCheck();


    //await this.runSecurityChecks();
    /* ---------- STATUS BAR ---------- */
if (Capacitor.isNativePlatform()) {
  await StatusBar.setOverlaysWebView({ overlay: true }); 
  await StatusBar.setStyle({ style: Style.Light });
}

    /* ---------- INSTALL ---------- */
    await this.install.checkFreshInstall();

    /* ---------- BACK BUTTON ---------- */
    this.registerBackButton();

    /* ---------- RESUME ---------- */
    this.handleAppResume();

    /* ---------- NETWORK ---------- */
    const status = await Network.getStatus();
    if (!status.connected) this.showNoInternet();

    Network.addListener('networkStatusChange', (s) => {
      if (!s.connected) this.showNoInternet();
    });

    /* ---------- UX ---------- */
    this.enableKeyboardAdjustment();
    this.registerGlobalCrashHandlers();
    this.blurInputsOnNavigation();

    /* ---------- SESSION ---------- */
    this.sessionTimeout.getState().subscribe(async (state) => {
      const url = this.router.url;
      if (url.startsWith('/login')) return;

      const net = await Network.getStatus();
      if (!net.connected) {
        this.showNoInternet();
        return;
      }

      if (state === 'SERVER_DOWN') this.showServerDown();
      if (state === 'SESSION_EXPIRED') this.showExpired();
    });
  }

  /* ================= SECURITY ================= */

  private async runRootCheck() {
    const rooted = await this.root.isDeviceRooted();

    console.log('[Security] Root status:', rooted);

    if (rooted) {
      await this.showRootBlockedAlert();
    }
  }
  private async showRootBlockedAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Security Alert',
      message: 'This device is rooted. App cannot run for security reasons.',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Exit',
          handler: () => App.exitApp(),
        },
      ],
    });

    await alert.present();
  }

  /* ================= RESUME ================= */

  private handleAppResume() {
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;

      if (this.router.url.startsWith('/login')) return;

      const valid = await this.auth.restoreSession();
      if (!valid) {
        await this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });
  }

  /* ================= GLOBAL ERRORS ================= */

  private registerGlobalCrashHandlers() {
    window.addEventListener('unhandledrejection', (e: any) => {
      this.crashlytics.recordNonFatal(e.reason, 'Unhandled Promise');
    });

    window.addEventListener('error', (e: any) => {
      this.crashlytics.recordFatal(e.error || e.message);
    });
  }

  /* ================= KEYBOARD ================= */

  private enableKeyboardAdjustment() {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.setResizeMode({ mode: KeyboardResize.Ionic  });
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
  private async runSecurityChecks() {

  const rooted = await this.root.isDeviceRooted();
  if (rooted) {
    await this.showRootBlockedAlert();
    return;
  }
  if (Capacitor.getPlatform() === 'android') {
    const trusted = await this.integrity.verifyDevice();

    if (!trusted) {
      await this.showIntegrityBlockedAlert();
      return;
    }
  }
}

  /* ================= POPUPS ================= */

  async showNoInternet() {
    const a = await this.alertCtrl.create({
      header: 'No Internet',
      message: 'Please check your internet connection.',
      backdropDismiss: false,
      buttons: ['OK'],
    });
    await a.present();
  }

  async showServerDown() {
    const a = await this.alertCtrl.create({
      header: 'Server Under Maintenance',
      message: 'Our servers are temporarily unavailable.',
      buttons: ['OK'],
    });
    await a.present();
  }

  async showExpired() {
    const a = await this.alertCtrl.create({
      header: 'Session Expired',
      message: 'Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: async () => {
            await this.auth.logout();
          },
        },
      ],
    });
    await a.present();
  }
  private async showIntegrityBlockedAlert() {
  const alert = await this.alertCtrl.create({
    header: 'Security Verification Failed',
    message: 'Device verification failed. App cannot run.',
    backdropDismiss: false,
    buttons: [
      {
        text: 'Exit',
        handler: () => App.exitApp(),
      },
    ],
  });

  await alert.present();
}

  /* ================= BACK BUTTON ================= */


private backPressedOnce = false;

// private registerBackButton() {

//   if (!Capacitor.isNativePlatform()) return;

//   this.platform.backButton.subscribeWithPriority(9999, async () => {

//     /* CLOSE UI ELEMENTS */

//     const modal = await this.modalCtrl.getTop();
//     if (modal) {
//       await modal.dismiss();
//       return;
//     }

//     const popover = await this.popoverCtrl.getTop();
//     if (popover) {
//       await popover.dismiss();
//       return;
//     }

//     const actionSheet = await this.actionSheetCtrl.getTop();
//     if (actionSheet) {
//       await actionSheet.dismiss();
//       return;
//     }

//     const loader = await this.loadingCtrl.getTop();
//     if (loader) {
//       await loader.dismiss();
//       return;
//     }

//     /* ROUTING */

//     const url = this.router.url;

//     const rootPages = [
//       '/home',
//       '/booking',
//       '/delivery',
//       '/account'
//     ];

//     const isRootPage = rootPages.some(route => url.startsWith(route));

//     /* DOUBLE BACK EXIT */

//     if (isRootPage) {

//       if (this.backPressedOnce) {
//         App.exitApp();
//         return;
//       }

//       this.backPressedOnce = true;

//       const exitToast = await this.toastCtrl.create({
//         message: 'Please click BACK again to exit',
//         duration: 2000,
//         position: 'bottom',
//         cssClass: 'exit-toast'
//       });

//       await exitToast.present();

//       setTimeout(() => {
//         this.backPressedOnce = false;
//       }, 2000);

//       return;
//     }

//     /* NORMAL BACK */

//     if (this.routerOutlet?.canGoBack()) {
//       this.routerOutlet.pop();
//     } else {
//       await this.router.navigateByUrl('/home', { replaceUrl: true });
//     }

//   });

// }


private registerBackButton() {

  if (!Capacitor.isNativePlatform()) return;

  this.platform.backButton.subscribeWithPriority(9999, async () => {

    /* CLOSE UI ELEMENTS FIRST */

    const modal = await this.modalCtrl.getTop();
    if (modal) {
      await modal.dismiss();
      return;
    }

    const popover = await this.popoverCtrl.getTop();
    if (popover) {
      await popover.dismiss();
      return;
    }

    const actionSheet = await this.actionSheetCtrl.getTop();
    if (actionSheet) {
      await actionSheet.dismiss();
      return;
    }

    const loader = await this.loadingCtrl.getTop();
    if (loader) {
      await loader.dismiss();
      return;
    }

    /* CURRENT ROUTE */

    const url = this.router.url;

    /* ACCOUNT / BOOKING / DELIVERY → GO HOME */

    if (
      url.startsWith('/account') ||
      url.startsWith('/booking') ||
      url.startsWith('/delivery')
    ) {
      await this.router.navigateByUrl('/home');
      return;
    }

    /* HOME → DOUBLE BACK TO EXIT */

    if (url.startsWith('/home')) {

      if (this.backPressedOnce) {
        App.exitApp();
        return;
      }

      this.backPressedOnce = true;

      const toast = await this.toastCtrl.create({
        message: 'Please click BACK again to exit',
        duration: 2000,
        position: 'bottom',
        cssClass: 'exit-toast-native',
      });

      await toast.present();

      setTimeout(() => {
        this.backPressedOnce = false;
      }, 2000);

      return;
    }

    /* NORMAL BACK NAVIGATION */

    if (this.routerOutlet?.canGoBack()) {
      this.routerOutlet.pop();
    } else {
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    }

  });

}



}
