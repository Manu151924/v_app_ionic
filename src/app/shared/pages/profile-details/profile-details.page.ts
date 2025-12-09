import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonChip,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';

import { copyOutline, trashOutline } from 'ionicons/icons';
import { AppStorageService } from '../../services/app-storage';
@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.page.html',
  styleUrls: ['./profile-details.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonLabel,
    IonChip,
    IonCard,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class ProfileDetailsPage implements OnInit {

  vendorName = '';
  vendorEmail = '';
  vendorGstin = '';
  vendorPhone = '';
  contactList: any[] = [];

  constructor(private storage: AppStorageService) {
    addIcons({ copyOutline, trashOutline });
  }

  async ngOnInit() {
    const user = await this.storage.getUserDetails();

    if (!user) return;

    this.vendorName   = user.vendorName ?? '';
    this.vendorEmail  = user.vendorEmail ?? '';
    this.vendorGstin  = user.vendorGstin ?? '';
    this.vendorPhone  = user.vendorPhone ?? '';
    this.contactList  = user.contactList ?? [];
  }

}
