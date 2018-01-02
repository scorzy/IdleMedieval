import { Game } from './game';
import * as Decimal from 'break_infinity.js'
import { Base } from './base'
import { Unit } from './unit'
import { Bonus } from './bonus'

export class Production extends Base {

    prodPerTick: Decimal
    prodPerSec: Decimal

    bonus = new Array<Bonus>()

    constructor(
        public productor: Unit,
        public product: Unit,
        public rateo: Decimal,
        game: Game,
        _id: string = "",
        public defUnlocked = true
    ) {
        super(productor.id + "/" + product.id + "/" + _id, "", "", game)
        this.unlocked = defUnlocked
        this.productor.producs.push(this)
        this.product.madeBy.push(this)
    }

    reload() {
        this.prodPerSec = this.rateo.times(this.productor.percentage / 100).times(this.productor.boost.plus(1))
        //    Bonus
        let bonus = new Decimal(1)
        for (let bon of this.bonus.filter(b => b.isAactive()))
            bonus = bonus.plus(bon.getBoost())

        //    Unit Bonus
        if (this.rateo.greaterThan(0)) {
            bonus = bonus.plus(this.product.totBonus)
            bonus = bonus.plus(this.productor.totBonusProd)
        }

        this.prodPerSec = this.prodPerSec.times(bonus)
        this.prodPerTick = this.prodPerSec.div(5).times(this.productor.quantity)
    }
}
