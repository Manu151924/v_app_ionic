import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {
  IonContent, IonItem, IonInput, ToastController
} from '@ionic/angular/standalone';
import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonItem, IonContent, IonInput, CommonModule, FormsModule],
})
export class LoginPage implements OnInit {
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private apiService = inject(Api);
  private authService = inject(Auth);
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

  ngOnInit() {
    this.restoreResendState();
  }
   ionViewWillEnter() {
    this.mobileNumber = '';
    this.otp = '';
    this.showOtpField = false;
    this.resendCount = 0;
    this.resendDisabled = false;
    this.resendButtonText = 'Resend OTP';
    localStorage.removeItem('otpResendState'); // optional: clear cooldown
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

  onLogoClick() {
    this.mobileNumber = '';
    this.showOtpField = false;
  }
isSendingOtp = false;   

sendOtp() {
  if (!/^\d{10}$/.test(this.mobileNumber)) {
    this.errorMessage = 'Mobile number should be 10 digits.';
    this.showToast(this.errorMessage);
    return;
  }

  if (this.isSendingOtp) return;    // prevent second click

  this.isSendingOtp = true;         // disable button

  this.apiService.sendOtp(this.mobileNumber).subscribe({
    next: (res) => {
      console.log('Send OTP Response:', res);

      this.isSendingOtp = false;   // enable again

      if (res?.success === true || res?.data?.success === true) {
        this.successMessage = res.message || 'OTP sent successfully.';
        this.showToast(this.successMessage, 'success');
        this.showOtpField = true;
      } else {
        this.errorMessage =
          res?.message ||
          res?.data?.message ||
          'Failed to send OTP. Please try again.';
        this.showToast(this.errorMessage);
      }
    },
    error: (err) => {
      console.error('Send OTP Error:', err);

      this.isSendingOtp = false;   // enable again

      if (err?.error?.message) {
        this.errorMessage = err.error.message;
      } else {
        this.errorMessage = 'Something went wrong. Please try again.';
      }
      this.showToast(this.errorMessage);
    },
  });
}

resendTimer: number = 0;
resendInterval: any;


cooldownEndTime: number = 0;

    resendOtp() {
      if (this.resendDisabled) {
        this.showToast('You have exceeded the maximum attempts. Try again after 10 minutes.');
        return;
      }
      if (!/^\d{10}$/.test(this.mobileNumber)) {
        this.showToast('Mobile number should be 10 digits to resend OTP.');
        return;
      }

      if (this.resendCount < 3) {
        this.resendCount++;

        this.apiService.sendOtp(this.mobileNumber).subscribe({
          next: (res) => {
            if (res && res.data?.success === true) {
              this.showToast(`OTP sent successfully (${this.resendCount}/3).`, 'success');
            } else {
              this.showToast(res.message || 'Failed to resend OTP.');
            }
          },
          error: () => {
            this.showToast('Something went wrong while resending OTP.');
          }
        });
        if (this.resendCount === 3) {
          this.triggerCooldown();
        }

      } else {
        this.triggerCooldown();
      }
    }

 private triggerCooldown() {
    this.resendDisabled = true;
    this.resendButtonText = 'Wait 10 minutes...';
    this.errorMessage =
      'You have reached the maximum resend limit (3 attempts). Try again after 10 minutes.';
    this.showToast(this.errorMessage);
    this.saveResendState(true); 
    this.startCooldownTimer(10 * 60 * 1000);
  }

  private startCooldownTimer(duration: number) {
    clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => {
      this.resendCount = 0;
      this.resendDisabled = false;
      this.resendButtonText = 'Resend OTP';
      this.errorMessage = '';
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
    const now = Date.now();
    const timePassed = now - lastResendTime;

    if (cooldownActive && timePassed < 10 * 60 * 1000) {
      this.resendDisabled = true;
      this.resendButtonText = 'Wait 10 minutes...';
      const remaining = 10 * 60 * 1000 - timePassed;
      this.startCooldownTimer(remaining);
    } else {
      this.resendCount = 0;
      this.resendDisabled = false;
      this.resendButtonText = 'Resend OTP';
      localStorage.removeItem('otpResendState');
    }
  }

async login() {
  if (!/^\d{6}$/.test(this.otp)) {
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

        this.showToast('Login successful!', 'success');
        await this.router.navigate(['/home']);
      } 
      else {
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
    value = value.substring(0, 10);
    this.mobileNumber = value;
  } else {
    value = value.substring(0, 6);
    this.otp = value;
  }
  event.target.value = value;
}


}
