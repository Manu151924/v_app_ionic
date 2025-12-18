import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { finalize } from 'rxjs/operators';

import {
  IonContent,
  IonItem,
  IonInput,
  ToastController,
  IonIcon
} from '@ionic/angular/standalone';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';
import { Crashlytics } from 'src/app/shared/services/crashlytics';

import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronBack } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonItem, IonContent, IonInput, CommonModule, FormsModule, IonIcon],
})
export class LoginPage implements OnInit {

  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private apiService = inject(Api);
  private authService = inject(Auth);
  private crashlytics = inject(Crashlytics);

  version = environment.version;

  mobileNumber: string = '';
  otp: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  showOtpField: boolean = false;

  resendCount: number = 0;
  resendDisabled: boolean = false;
  resendButtonText: string = 'Resend OTP';
  private cooldownTimer: any;

  isSendingOtp = false;

  ngOnInit() {
    addIcons({ chevronBack, arrowBackOutline });
    this.restoreResendState();

  }

  ionViewWillEnter() {
    this.resetFormState();
  }

  private resetFormState() {
    this.mobileNumber = '';
    this.otp = '';
    this.showOtpField = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  handleBack() {
    this.onLogoClick();
  }

  onLogoClick() {
    this.mobileNumber = '';
    this.showOtpField = false;
  }

  /* ================= SEND OTP ================= */

  sendOtp() {
    if (this.isSendingOtp || !this.isValidMobileNumber(this.mobileNumber)) return;

    this.isSendingOtp = true;

    this.apiService
      .sendOtp(this.mobileNumber)
      .pipe(finalize(() => (this.isSendingOtp = false)))
      .subscribe({
        next: (res) => this.handleOtpResponse(res, 'send'),
        error: (err) => this.handleError(err, 'send')
      });
  }

  resendOtp() {
    if (this.resendDisabled || !this.isValidMobileNumber(this.mobileNumber)) return;

    this.apiService.sendOtp(this.mobileNumber).subscribe({
      next: (res) => this.handleOtpResponse(res, 'resend'),
      error: (err) => this.handleError(err, 'resend')
    });
  }

  private handleOtpResponse(res: any, type: 'send' | 'resend') {
    if (res?.success === true || res?.data?.success === true) {

      if (type === 'send') {
        this.successMessage = 'OTP sent successfully!';
        this.showOtpField = true;
        this.crashlytics.logBusinessEvent('OTP_SENT');

      } else if (type === 'resend') {
        this.resendCount++;
        if (this.resendCount > 3) this.triggerCooldown();
      }

      this.showToast(this.successMessage, 'success');
    } else {
      this.showToast(res?.message || 'Failed to send OTP.', 'danger');
    }
  }

  private handleError(err: any, type: 'send' | 'resend') {
    console.error(`${type} OTP Error:`, err);
    const message = err?.error?.message || 'Something went wrong. Please try again.';
    this.showToast(message, 'danger');
  }

  private isValidMobileNumber(mobileNumber: string): boolean {
    if (!/^\d{10}$/.test(mobileNumber)) {
      this.errorMessage = 'Mobile number should be 10 digits.';
      this.showToast(this.errorMessage, 'danger');
      return false;
    }
    return true;
  }

  private triggerCooldown() {
    this.resendDisabled = true;
    this.resendButtonText = 'Wait 10 minutes...';

    this.showToast(
      'You have reached the maximum resend limit (3 attempts). Try again after 10 minutes.'
    );

    this.saveResendState(true);
    this.startCooldownTimer(10 * 60 * 1000);
  }

  private startCooldownTimer(duration: number) {
    clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => {
      this.resendCount = 0;
      this.resendDisabled = false;
      this.resendButtonText = 'Resend OTP';
      localStorage.removeItem('otpResendState');
    }, duration);
  }

  private saveResendState(cooldownActive: boolean = false) {
    const data = {
      resendCount: this.resendCount,
      lastResendTime: Date.now(),
      cooldownActive,
    };
    localStorage.setItem('otpResendState', JSON.stringify(data));
  }

  private restoreResendState() {
    const stored = localStorage.getItem('otpResendState');
    if (!stored) return;

    const { resendCount, lastResendTime, cooldownActive } = JSON.parse(stored);
    const timePassed = Date.now() - lastResendTime;

    if (cooldownActive && timePassed < 10 * 60 * 1000) {
      this.resendDisabled = true;
      this.resendCount = resendCount;
      this.resendButtonText = 'Wait 10 minutes...';
      this.startCooldownTimer(10 * 60 * 1000 - timePassed);
    } else {
      this.resendCount = 0;
      this.resendDisabled = false;
      this.resendButtonText = 'Resend OTP';
      localStorage.removeItem('otpResendState');
    }
  }

  async login() {
    if (this.resendDisabled) {
      return this.showToast(
        'You cannot verify OTP now. Please try again after 10 minutes.'
      );
    }

    if (!this.otp || !/^\d{6}$/.test(this.otp)) {
      return this.showToast('OTP must be 6 digits.');
    }

    this.apiService.verifyOtp(this.otp, this.mobileNumber).subscribe({
      next: async (res) => {
        if (res?.success === true && res?.data?.accessToken) {

          await this.authService.setUserData(res.data);

          const vendors = res.data?.vendors || [];
          const bookingVendor = vendors.find((v: any) => v.vendorType === 'BOOKING');
          const deliveryVendor = vendors.find((v: any) => v.vendorType === 'DELIVERY');

          localStorage.setItem('bookingVendorId', bookingVendor?.vendorId?.toString() || '');
          localStorage.setItem('deliveryVendorId', deliveryVendor?.vendorId?.toString() || '');
          localStorage.setItem('vendorType', JSON.stringify(vendors.map((v: any) => v.vendorType)));
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          this.crashlytics.setUserContext({
            userId: this.mobileNumber,
            role: 'VENDOR',
            appVersion: environment.version
          });
          this.crashlytics.logBusinessEvent('LOGIN_SUCCESS');
          this.showToast('Login successful!', 'success');
          await this.router.navigate(['/home']);

        } else {
          this.showToast(res?.message || 'Invalid OTP.');
        }
      },
      error: () => this.showToast('Login failed. Try again.')
    });
  }

  filterNumberInput(event: any, type: 'mobile' | 'otp') {
    let value = event.target.value || '';
    value = value.replace(/\D/g, '');

    if (type === 'mobile') {
      this.mobileNumber = value.substring(0, 10);
    } else {
      this.otp = value.substring(0, 6);
    }

    event.target.value = value;
  }
}
