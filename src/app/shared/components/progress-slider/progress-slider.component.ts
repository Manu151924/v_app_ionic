import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';


@Component({
  selector: 'app-progress-slider',
  templateUrl: './progress-slider.component.html',
  styleUrls: ['./progress-slider.component.scss'],
  imports: [CommonModule,DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressSliderComponent  implements OnInit {

  constructor() { 
  }

  ngOnInit() {
  }
  @Input() value = 0; // 0-1
 @Input() booking: { label: string; percent: number; gradient: string }[] = []; 
  @Output() valueChange = new EventEmitter<number>();
  @Input() delivery: {label: string; value:number;}[] = [];
  private dragging = false;

  get face(): string {
    if (this.value >=0 && this.value <= 33) return '😠';
    if (this.value >= 34 && this.value <= 64) return '☺️';
    return '😄';
  }

  // startDrag(event: MouseEvent) {
  //   this.dragging = false;
  //   this.updateValueFromEvent(event);
  // }

  // onDrag(event: MouseEvent) {
  //   if (!this.dragging) return;
  //   this.updateValueFromEvent(event);
  // }

  // endDrag() {
  //   this.dragging = false;
  // }

  getGradient(value: number): string {
  if (value >= 0 && value <= 33) {
    // Dominantly red
    return 'linear-gradient(90deg, #DA2723 0%, #D2E241 19.1%, #41D844 100%)';
  } else if (value >= 34 && value <= 66) {
    return 'linear-gradient(90deg, #DA2723 0%, #D2E241 17.7%, #41D844 100%)';
  } else {
    return 'linear-gradient(90deg, #42D844 0%, #D2E241 48.2%, #DA2D24 100%)';
  }
}

}
