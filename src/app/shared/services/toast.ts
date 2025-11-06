// src/app/delivery/toast.service.ts
import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class Toast {
  constructor(private toastController: ToastController) {}

  async show(message: string, color: 'primary' | 'warning' | 'success' = 'primary', duration = 2000) {
    const toast = await this.toastController.create({
      message,
      color,
      duration,
      position: 'top'
    });
    await toast.present();
  }
}
