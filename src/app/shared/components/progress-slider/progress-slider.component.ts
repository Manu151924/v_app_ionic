import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-progress-slider',
  templateUrl: './progress-slider.component.html',
  styleUrls: ['./progress-slider.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSliderComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
  @Input() face: 'ANGRY' | 'HAPPY' | 'GREAT' = 'ANGRY';

  @Input() value = 0;
  @Input() booking: { label: string; percent: number; gradient: string }[] = [];
  @Input() delivery: { label: string; value: number; gradient: string }[] = [];
  @Input() gradient = '';

get faceIcon() {
  if (this.face === 'ANGRY') {
    return { type: 'emoji', value: '😠' };
  }

  if (this.face === 'HAPPY') {
    return { type: 'emoji', value: '🙂' };
  }

  return {
    type: 'image',
    value: 'assets/icon/great.png' // PNG for 😄
  };
}


  getGradient(value: number): string {
    if (value <= 33) {
      return 'linear-gradient(90deg,#DA2723,#D2E241,#41D844)';
    }
    if (value <= 66) {
      return 'linear-gradient(90deg,#DA2723,#D2E241,#41D844)';
    }
    return 'linear-gradient(90deg,#42D844,#D2E241,#DA2D24)';
  }
}
