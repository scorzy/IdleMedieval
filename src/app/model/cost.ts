import { Unit } from "./unit"
import { Decimal } from "decimal.js"

export class Cost {

    constructor(
        public what: Unit,
        public basePrice = new Decimal(1),
        public increment = new Decimal(1.1)
    ) { }


}
