import { Pipe, PipeTransform } from '@angular/core';
import { Decimal } from 'decimal.js';
import * as numberformat from 'swarm-numberformat';

@Pipe({
    name: 'format'
})
export class FormatPipe implements PipeTransform {

    transform(value: Decimal, args?: any): any {
        return (value.greaterThanOrEqualTo(0) ? "" : "-") + numberformat.formatShort(value.abs())
    }

}
