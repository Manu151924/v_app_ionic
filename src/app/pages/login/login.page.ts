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
import { AppStorageService } from 'src/app/shared/services/app-storage';

interface ResendOtpState {
  resendCount: number;
  lastResendTime: number;
  cooldownActive: boolean;
}

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
  private appStorage = inject(AppStorageService);

  version = environment.version;

  mobileNumber: string = '';
  otp: string = '';

  showOtpField: boolean = false;
  isSendingOtp = false;

  /** Resend OTP State */
  resendCount: number = 0;
  resendDisabled: boolean = false;
  resendButtonText: string = 'Resend OTP';
  private cooldownTimer: any;
  private readonly maxResends = 3;
  private readonly cooldownDuration = 10 * 60 * 1000; // 10 min

  ngOnInit() {
    this.restoreResendState();
  }

  ionViewWillEnter() {
    this.mobileNumber = '';
    this.otp = '';
    this.showOtpField = false;
  }

  /** ---------- Toast ----------- */
  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  onLogoClick() {
    this.mobileNumber = '';
    this.showOtpField = false;
  }

  /** ---------- SEND OTP ---------- */
  async sendOtp() {
    if (!/^\d{10}$/.test(this.mobileNumber)) {
      return this.showToast('Mobile number must be 10 digits.');
    }

    if (this.isSendingOtp) return;

    this.isSendingOtp = true;

    this.apiService.sendOtp(this.mobileNumber).subscribe({
      next: (res) => {
        this.isSendingOtp = false;
        if (res?.success === true) {
          this.showOtpField = true;
          this.showToast('OTP sent successfully.', 'success');
        } else {
          this.showToast(res?.message || 'Failed to send OTP.');
        }
      },
      error: (err) => {
        this.isSendingOtp = false;
        this.showToast(err?.error?.message || 'Something went wrong.');
      },
    });
  }

  /** ---------- RESEND OTP ---------- */
  async resendOtp() {
    if (this.resendDisabled) {
      return this.showToast('Try again after cooldown.');
    }

    if (!/^\d{10}$/.test(this.mobileNumber)) {
      return this.showToast('Enter valid phone no to resend OTP.');
    }

    if (this.resendCount < this.maxResends) {
      this.resendCount++;
      this.showToast(`OTP resent (${this.resendCount}/${this.maxResends})`, 'success');
      await this.saveResendState(false);

      if (this.resendCount === this.maxResends) {
        this.triggerCooldown();
      }
    } else {
      this.triggerCooldown();
    }
  }

  private async triggerCooldown() {
    this.resendDisabled = true;
    this.resendButtonText = 'Wait 10 minutes...';
    await this.saveResendState(true);

    this.showToast('Max OTP attempts reached. Try later.');

    const remainingTime = this.cooldownDuration;
    this.startCooldownTimer(remainingTime);
  }

  private startCooldownTimer(duration: number) {
    clearTimeout(this.cooldownTimer);

    this.cooldownTimer = setTimeout(async () => {
      this.resendCount = 0;
      this.resendDisabled = false;
      this.resendButtonText = 'Resend OTP';
      await this.removeResendState();
    }, duration);
  }

  /** ---------- SAVE STATE TO SECURE STORAGE ---------- */
  private async saveResendState(cooldownActive: boolean) {
    const state: ResendOtpState = {
      resendCount: this.resendCount,
      lastResendTime: Date.now(),
      cooldownActive
    };

    await this.appStorage.set('otpResendState', state);
  }

  private async removeResendState() {
    await this.appStorage.remove('otpResendState');
  }

  /** ---------- RESTORE STATE ---------- */
  private async restoreResendState() {
    const stored: ResendOtpState = await this.appStorage.get('otpResendState');

    if (!stored) return;

    const now = Date.now();
    const timePassed = now - stored.lastResendTime;

    this.resendCount = stored.resendCount || 0;

    if (stored.cooldownActive && timePassed < this.cooldownDuration) {
      this.resendDisabled = true;
      this.resendButtonText = 'Wait 10 minutes...';

      const remaining = this.cooldownDuration - timePassed;
      this.startCooldownTimer(remaining);
    } else {
      // reset
      this.resendCount = 0;
      this.resendDisabled = false;
      this.resendButtonText = 'Resend OTP';
      await this.removeResendState();
    }
  }

  /** ---------- LOGIN ---------- */
  async login() {

    if (this.resendDisabled) {
      return this.showToast('OTP attempts exhausted. Try later.');
    }

    if (!/^\d{6}$/.test(this.otp)) {
      return this.showToast('Enter valid 6-digit OTP');
    }

    this.apiService.verifyOtp(this.otp, this.mobileNumber).subscribe({
      next: async (res) => {

        if (res?.success === true && res?.data?.accessToken) {

          /** Store tokens & vendorIds/etc encrypted */
          await this.authService.setUserData(res.data);

          /** Save user metadata only */
          await this.appStorage.updateUserDetails({
            vendorId: res.data.vendorId,
            vendorType: res.data.vendorType,
            vendorName: res.data.vendorName,
            vendorEmail: res.data.vendorEmail,
            vendorPhone: res.data.vendorPhone,
            vendorGstin: res.data.vendorGstin,
            branchId: res.data.branchId,
            bookingVendorId: res.data.bookingVendorId,
            deliveryVendorId: res.data.deliveryVendorId,
            activeSegment: 'booking',
          });

          await this.removeResendState();

          this.showToast('Login successful!', 'success');
          this.router.navigate(['/home']);
        } 
        else {
          this.showToast(res?.message || 'Invalid OTP');
        }
      },
      error: () => this.showToast('Login failed. Try again.')
    });
  }

  /** Filter Input */
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
