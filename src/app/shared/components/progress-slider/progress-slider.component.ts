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
    if (this.value >=0 && this.value <= 33) return '😞';
    if (this.value >= 34 && this.value <= 64) return '🙂';
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
    return 'linear-gradient(90deg, #DA2D24 0%, #D2E241 60%, #42D844 100%)';
  } else if (value >= 34 && value <= 66) {
    // Mid range: yellow center dominant
    return 'linear-gradient(90deg, #D2E241 0%, #42D844 80%, #DA2D24 100%)';
  } else {
    // High: mostly green
    return 'linear-gradient(90deg, #42D844 0%, #D2E241 60%, #DA2D24 100%)';
  }
}
  private updateValueFromEvent(event: MouseEvent) {
    const el = (event.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const newVal = +(x / rect.width).toFixed(3);
    this.value = newVal;
    this.valueChange.emit(this.value);
  }


}
