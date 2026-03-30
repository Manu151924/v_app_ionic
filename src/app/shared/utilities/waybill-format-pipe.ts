import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'waybillFormat',
    standalone: true,
    pure: true
})
export class WaybillFormatPipe implements PipeTransform {

transform(value: string | number): string {
    if (!value) return '';

    const digits = value.toString().replace(/\s+/g, '');

    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
}
