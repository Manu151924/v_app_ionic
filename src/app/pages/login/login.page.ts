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

sendOtp() {
  if (!/^\d{10}$/.test(this.mobileNumber)) {
    this.errorMessage = 'Mobile number should be 10 digits.';
    this.showToast(this.errorMessage);
    return;
  }

  this.apiService.sendOtp(this.mobileNumber).subscribe({
    next: (res) => {
      console.log('Send OTP Response:', res);

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
      if (err?.error?.message) {
        this.errorMessage = err.error.message;
      } else {
        this.errorMessage = 'Something went wrong. Please try again.';
      }
      this.showToast(this.errorMessage);
    },
  });
}


  resendOtp() {
    if (this.resendDisabled) {
      this.showToast('Please wait before trying again after 10 minutes.');
      return;
    }

    if (!/^\d{10}$/.test(this.mobileNumber)) {
      this.errorMessage = 'Mobile number should be 10 digits to resend OTP.';
      this.showToast(this.errorMessage);
      return;
    }

    if (this.resendCount < 3) {
      this.resendCount++;

      this.apiService.sendOtp(this.mobileNumber).subscribe({
        next: (res) => {
          if (res && res.data?.success === true) {
            this.successMessage = `OTP re-sent successfully via ${
              res.data.channel || 'configured method'
            } (${this.resendCount}/3).`;
            this.showToast(this.successMessage, 'success');
          } else {
            this.errorMessage = res.message || 'Failed to resend OTP.';
            this.showToast(this.errorMessage);
          }
        },
        error: (err) => {
          console.error('Resend OTP Error:', err);
          this.errorMessage = 'Something went wrong while resending OTP.';
          this.showToast(this.errorMessage);
        },
      });

      this.saveResendState();
      if (this.resendCount >= 3) {
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
    this.showToast('OTP must be numeric and 6 digits.');
    return;
  }

  this.apiService.verifyOtp(this.otp, this.mobileNumber).subscribe({
    next: async (res) => {
      console.log('Verify OTP Response:', res);

      if (res?.success === true && res?.data?.accessToken) {
        await this.authService.setUserData(res.data);

        localStorage.setItem('vendorType', JSON.stringify(res.data.vendorType || []));
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('vendorId', res.data.vendorId?.toString() || '');

        this.showToast(res.message || 'Login successful!', 'success');
        await this.router.navigate(['/home']);
      } 
      else {
        const apiMessage =
          res?.message ||
          res?.data?.message ||
          'Invalid OTP. Please try again.';
        this.showToast(apiMessage);
      }
    },
    error: (err) => {
      console.error('Verify OTP Error:', err);
      const errorMsg =
        err?.error?.message ||
        'Login failed. Please check your network or try again.';
      this.showToast(errorMsg);
    },
  });
}

}
