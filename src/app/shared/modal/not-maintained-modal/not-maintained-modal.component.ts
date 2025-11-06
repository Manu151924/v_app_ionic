// import { Component, Input, inject } from '@angular/core';
// import { ModalController, IonicModule } from '@ionic/angular';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-not-manifested-modal',
//   template: `
//     <ion-header>
//       <ion-toolbar>
//         <ion-title>NOT MANIFESTED</ion-title>
//         <ion-buttons slot="end">
//           <ion-button (click)="close()">Close</ion-button>
//         </ion-buttons>
//       </ion-toolbar>
//     </ion-header>

// <ion-content class="ion-padding notman-list">
//   @for (item of notManifestedData; track item.waybill ){
//   <div class="notman-card">
//     <div class="notman-row">
//       <div>
//         <span class="wb-label">WB#</span>
//         <span class="wb-value">{{ item.waybill }}</span>
//       </div>
//       <div class="pkg-label">Booked/MF/Remaining Pkgs.</div>
//       <div class="pkg-numbers">
//         <span class="green">{{ item.booked }}</span>
//         <span class="amber">{{ item.manifested }}</span>
//         <span class="red">{{ item.remaining }}</span>
//       </div>
//     </div>
//     <div class="notman-row consignor-row">
//       <span class="consignor-label">Consignor</span>
//       <span class="consignor-value">{{ item.consignor || 'Unknown' }}</span>
//     </div>
//   </div>

//   }

// </ion-content>

//   `,
//   styles: [`
//    .notman-list {
//   padding-top: 18px;
// }
// .notman-card {
//   background: #fff;
//   border-radius: 13px;
//   border-left: 4px solid #d9534f;
//   margin-bottom: 15px;
//   box-shadow: 0 1px 7px rgba(60,72,88,0.05);
//   padding: 12px 16px 10px 16px;
//   display: flex;
//   flex-direction: column;
// }

// .notman-row {
//   display: flex;
//   align-items: center;
//   margin-bottom: 6px;
//   gap: 12px;

//   &:last-child {
//     margin-bottom: 0;
//   }
// }

// .wb-label {
//   font-size: 13.5px;
//   color: #444;
//   font-weight: 600;
// }
// .wb-value {
//   font-size: 14px;
//   color: #222;
//   font-weight: 700;
//   margin-left: 6px;
// }
// .pkg-label {
//   margin-left: 16px;
//   font-size: 13px;
//   color: #656565;
//   font-weight: 600;
// }
// .pkg-numbers {
//   margin-left: 11px;
//   font-size: 13.5px;
//   font-weight: 700;
//   span.green { color: #1cb14f; }
//   span.amber { color: #f0ad4e; }
//   span.red { color: #d9534f; }
// }
// .consignor-row {
//   margin-top: 8px;
//   .consignor-label {
//     font-size: 12.5px;
//     color: #999;
//     font-weight: 600;
//     margin-right: 7px;
//   }
//   .consignor-value {
//     font-size: 14px;
//     color: #222;
//     font-weight: 500;
//   }
// }
//   `],
//   standalone: true,
//   imports: [IonicModule, CommonModule]
// })
// export class NotManifestedModalComponent {
//   private modalCtrl = inject(ModalController);

//   @Input() notManifestedData: {
//     waybill: string,
//     consignor: string,
//     booked: number,
//     manifested: number,
//     remaining: number,
//     pickupDate: string
//   }[] = [];

//   close() {
//     this.modalCtrl.dismiss();
//   }
// }
