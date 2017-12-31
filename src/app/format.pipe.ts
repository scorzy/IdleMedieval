import { Pipe, PipeTransform } from '@angular/core';
import { Decimal } from 'decimal.js';
import * as numberformat from 'swarm-numberformat';
import { ServService } from 'app/serv.service'


@Pipe({ name: 'format' })
export class FormatPipe implements PipeTransform {
  constructor(public gameService: ServService) {
  }
  public transform(value: Decimal): any {

    return this.gameService.options.usaFormat ?
      (
        value.abs().lessThan(10) ? value.toNumber().toFixed(2).replace(/\.0+$/, '') :
          value.abs().lessThan(100) ? value.toNumber().toFixed(1).replace(/\.0+$/, '') :
            (value.greaterThanOrEqualTo(0) ? "" : "-") + numberformat.formatShort(value.abs())
      ) : (
        value.abs().lessThan(10) ? value.toNumber().toFixed(2).replace(/\.0+$/, '').replace(".", ",") :
          value.abs().lessThan(100) ? value.toNumber().toFixed(1).replace(/\.0+$/, '').replace(".", ",") :
            (value.greaterThanOrEqualTo(0) ? "" : "-") + numberformat.formatShort(value.abs()).replace(".", ",")
      )

  }
}
