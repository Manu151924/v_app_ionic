import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons'

@Component({
  selector: 'app-privacy-and-policy-modal',
  templateUrl: './privacy-and-policy-modal.component.html',
  styleUrls: ['./privacy-and-policy-modal.component.scss'],
  imports: [IonButtons, IonIcon, CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton],
})
export class PrivacyAndPolicyModalComponent  {

    private modalCtrl = inject(ModalController);
    constructor(){
    addIcons({close});
  }

   close() {
    this.modalCtrl.dismiss();
  }

}
