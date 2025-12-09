import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonChip, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { copyOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.page.html',
  styleUrls: ['./profile-details.page.scss'],
  standalone: true,
  imports: [IonIcon, IonLabel, IonChip, IonCard, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ProfileDetailsPage implements OnInit {

  vendorName: string = '';
  vendorEmail: string = '';
  vendorGstin: string = '';
  vendorPhone: string = '';
  contactList: any[] = [];
  constructor(){
    addIcons({copyOutline,trashOutline});
  }

  ngOnInit() {
    this.vendorName = localStorage.getItem("vendorName") ?? '';
    this.vendorEmail = localStorage.getItem("vendorEmail") ?? '';
    this.vendorGstin = localStorage.getItem("vendorGstin") ?? '';
    this.vendorPhone = localStorage.getItem("vendorPhone") ?? '';
    this.contactList = JSON.parse(localStorage.getItem("contactList") ?? '[]');
  }
}
