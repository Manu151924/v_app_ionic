import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonCard, IonItem, IonIcon , IonSelect,IonSelectOption, IonNote, IonButton, IonToolbar, IonFooter, IonButtons, IonText, IonModal, IonRow, IonCol, IonGrid } from "@ionic/angular/standalone";
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { MatNativeDateModule } from '@angular/material/core'; 
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormsModule , } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { formatDisplayDate, formatMonthYearShort } from 'src/app/shared/utilities/date-utils';
import { AbsentVehicle, Delivery, TripVehicle } from 'src/app/shared/services/delivery';
import { TripStatusTableComponent } from "src/app/shared/components/trip-status-table/trip-status-table.component";
import { AbsentVehicleListComponent } from 'src/app/shared/components/absent-vehicle-list/absent-vehicle-list.component';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart.component';
import { ProgressSliderComponent } from 'src/app/shared/components/progress-slider/progress-slider.component';
import { addIcons } from 'ionicons';
import { calendar, carOutline, chevronDownOutline, chevronUpOutline, document, location, shieldCheckmark } from 'ionicons/icons';
import { TripReportComponent } from "src/app/shared/components/trip-report/trip-report.component";
import { TripReportDeliveryComponent } from "src/app/shared/components/trip-report-delivery/trip-report-delivery.component";
import { InventoryCardComponent } from "src/app/shared/components/inventory-card/inventory-card.component";



@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.page.html',
  styleUrls: ['./delivery.page.scss'],
  imports: [IonGrid, IonCol, IonRow, IonModal,
    IonContent,
    IonCard,
    MatDatepickerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatNativeDateModule,
    IonIcon,
    IonButton,
    FormsModule,
    NgxChartsModule,
    CommonModule,
    PieChartComponent,
    ProgressSliderComponent,
    IonToolbar,
    IonFooter,
    IonButtons, TripReportDeliveryComponent, InventoryCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryPage implements OnInit {
      @Input() vendorId!: string;


  form: FormGroup;
  cities = ['Delhi', 'Mumbai', 'Hyderabad', 'Chennai'];
  @ViewChild('monthPicker') monthPicker!: MatDatepicker<Date>;

  today = new Date();
  minDate!: Date;
  maxDate!: Date;
  availableMonths: string[] = [];
  selectedMonth: Date = new Date();
  calendarOpen = false;
  selectedDate: Date = new Date(); 
  tempSelectedDate: Date = new Date();

  tripVehicles$!: Observable<TripVehicle[]>;
  absentVehicles$!: Observable<AbsentVehicle[]>;
  barData$ = this.service.getBarData();
  pieChartData$ = this.service.getPieChartData();
  amount =   Math.floor(Math.random() * (99999 - 100000 + 1)) + 100000;
  pending =   Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  usage =   Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  safe =   Math.floor(Math.random() * (99 - 10 + 1)) + 10;

  displayedLimit = 5;
  isExpanded = false;
  progressValue = 0;

  colorScheme: Color = {
    name: 'myScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FFBC00', '#FFBC00', '#13C15B', '#13C15B', '#13C15B']
  };
bars = [
  { label: 'Vehicle Attendance', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 },
  { label: 'Safedrop Usage', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 },
  { label: 'Market Vehicle Usage', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 }
];
  colorSchemeForPie: Color = {
    name: 'pieScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#06B4A2', '#FF8A0D']
  };

  constructor(private fb: FormBuilder, private service: Delivery) {
    this.form = this.fb.group({
      selectedCity: [this.cities[0]],
      selectedDate: [new Date()],
      selectedMonth: [new Date()]
    });
    addIcons({location,calendar,document,carOutline,shieldCheckmark,chevronDownOutline,chevronUpOutline})
  }


  ngOnInit(): void {
    this.tripVehicles$ = this.service.getTripVehicles();
    this.absentVehicles$ = this.service.getAbsentVehicles();
    this.setDateRange();
    this.updateAverageProgress();
    this.generateAvailableMonths();
  }
  formatXTicks(value: number): string {
  return value.toString();
}

  changeCity(event: any) {
    this.barData$ = this.service.getBarData();
    this.amount =   Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    this.pending =   Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    this.usage =   Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    this.safe =   Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    this.bars = [
  { label: 'Vehicle Attendance', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 },
  { label: 'Safedrop Usage', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 },
  { label: 'Market Vehicle Usage', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 }
];
this.updateAverageProgress();
}
  setDateRange() {
    const today = new Date();
    this.maxDate = today;
    const min = new Date();
    min.setMonth(today.getMonth() - 12);
    this.minDate = min;
  }

  generateAvailableMonths() {
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const currentYear = this.today.getFullYear();
    const currentMonth = this.today.getMonth();
    this.availableMonths = [];
    for (let m = 0; m <= currentMonth; m++) {
      this.availableMonths.push(`${monthNames[m]}-${currentYear.toString().slice(-2)}`);
    }
  }

 displayDate: string = formatDisplayDate(new Date());

  formatMonth(date: Date) {
    return formatMonthYearShort(date);
  }

  toggleExpansion() {
    this.isExpanded = !this.isExpanded;
    this.displayedLimit = this.isExpanded ? 1000 : 5;
  }
  openMonthPicker() {
    this.monthPicker.open();
  }

  onProgressChange(newVal: number) {
    this.progressValue = newVal;
  }

  trackByVeh(index: number, item: TripVehicle) { return item.vehNo; }
  trackByAbsent(index: number, item: AbsentVehicle) { return item.vehNo; }
  setToday() {
    this.form.get('selectedDate')?.setValue(new Date());
  }
  get selectedCityControl(): FormControl {
  return this.form.get('selectedCity') as FormControl;
}
openCalendar() {
    this.tempSelectedDate = this.selectedDate;
    console.log(this.tempSelectedDate);
    this.calendarOpen = true;
  }

  onDateSelect(date: Date) {
    this.tempSelectedDate = date;
    this.displayDate = formatDisplayDate(date);
    console.log(this.displayDate);
  }

  cancelDate() {
    this.tempSelectedDate = this.selectedDate;
    this.calendarOpen = false;
  }
  confirmDate() {
    this.selectedDate = this.tempSelectedDate;
    this.calendarOpen = false;
  }
  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    this.selectedMonth = normalizedMonth;
    this.form.patchValue({ selectedMonth: normalizedMonth });
    this.bars = [
  { label: 'Vehicle Attendance', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 },
  { label: 'Safedrop Usage', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 },
  { label: 'Market Vehicle Usage', value: Math.floor(Math.random() * (99 - 10 + 1)) + 10 }
];
this.updateAverageProgress();
    datepicker.close();
  }

getGradient(value: number): string {
  if (value >= 0 && value <= 33) {
    // Dominantly red
    return 'linear-gradient(90deg, #DA2D24 0%, #D2E241 60%, #42D844 100%)';
  } else if (value >= 34 && value <= 66) {
    // Mid range: yellow center dominant
    return 'linear-gradient(90deg, #D2E241 0%, #42D844 80%, #DA2D24 100%)';
  } else {
    // High: mostly green
    return 'linear-gradient(90deg, #42D844 0%, #D2E241 60%, #DA2D24 100%)';
  }
}

updateAverageProgress() {
  const total = this.bars.reduce((sum, bar) => sum + bar.value, 0);
  this.progressValue = Math.round(total / this.bars.length);
}
}
