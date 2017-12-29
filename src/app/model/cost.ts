import { Unit } from "./unit"
import * as Decimal from 'break_infinity.js'

export class Cost {

    constructor(
        public what: Unit,
        public basePrice = new Decimal(1),
        public increment = new Decimal(1.1)
    ) { }


}
