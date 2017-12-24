import { Decimal } from 'decimal.js';
import { Base } from './base'
import { Unit } from './unit';

export class Production extends Base {

    prodPerTick: Decimal
    prodPerSec: Decimal

    constructor(
        public productor: Unit,
        public product: Unit,
        public rateo: Decimal,
        _id: string = "",
        _unlocked = true
    ) {
        super(productor.id + "/" + product.id + "/" + _id)
        this.unlocked = _unlocked
    }

    reload() {
        this.prodPerSec = this.rateo.times(this.productor.percentage / 100)
        this.prodPerTick = this.prodPerSec.div(5)
    }
}
