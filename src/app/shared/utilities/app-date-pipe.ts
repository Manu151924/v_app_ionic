import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'appDate',
  pure: true
})
export class AppDatePipe implements PipeTransform {

  private datePipe = new DatePipe('en-US');

  transform(value: any): string | null {
    const formatted = this.datePipe.transform(value, 'dd-MMMM-yyyy');
    return formatted ? formatted.toUpperCase() : null;
  }
}
