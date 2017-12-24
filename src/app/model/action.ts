import { Base } from './base'
import { Cost } from './cost'
import { Unit } from 'app/model/unit';
import { Decimal } from "decimal.js"

export class Action extends Base {

    realPriceNow = new Array<Cost>()
    maxBuy = new Decimal(0)
    oneTime = false
    showNumber = true
    showHide = true
    show = true
    owned = false
    public up: Action

    constructor(
        id: string,
        public price = new Array<Cost>(),
        public unit: Unit = null
    ) {
        super(id)
        this.realPriceNow = price
    }

    getCosts(number: Decimal = new Decimal(1)) {
        return this.price.map(c => {
            const constRet = new Cost(c.what)
            if (!c.increment.equals(1)) {
                constRet.basePrice = c.basePrice.times(
                    (c.increment.pow(this.quantity)).times(
                        (c.increment.pow(number)).minus(1))
                ).div(c.increment.minus(1)).ceil()
            } else {
                constRet.basePrice = c.basePrice.times(number).ceil()
            }
            return constRet
        })
    }

    reloadMaxBuy() {
        if (!this.unlocked) {
            this.maxBuy = new Decimal(0)
        } else {
            //    https://blog.kongregate.com/the-math-of-idle-games-part-i/
            let max = new Decimal(Number.POSITIVE_INFINITY)
            for (const p of this.price) {
                max = Decimal.min(max,
                    Decimal.floor(p.increment.lessThanOrEqualTo(1) ? p.what.quantity.div(p.basePrice) : (
                        ((p.increment.minus(1)).times(p.what.quantity))
                            .div((p.increment.pow(this.quantity)).times(p.basePrice))
                    ).plus(1).log(p.increment))
                )
            }
            // console.log(max.toString())
            this.maxBuy = max
        }
    }

    buy(number: Decimal = new Decimal(1)): boolean {
        if (number.lessThanOrEqualTo(0) || !this.unlocked) {
            return false
        }

        const prices = this.getCosts(number)
        if (prices.filter(v => v.basePrice.greaterThan(v.what.quantity)).length === 0) {
            prices.forEach(p => p.what.quantity = p.what.quantity.minus(p.basePrice))
            this.quantity = this.quantity.plus(number)
            this.realPriceNow = this.getCosts()
            this.owned = true
            return true
        }
        return false
    }
    getId() {
        return (this.unit ? this.unit.id : "") + "_" + this.id
    }
}

export class Buy extends Action {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null) {
        super("buy", price, unit)
        this.name = "Hire"
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.quantity = this.quantity.plus(number)
            this.unit.quantity = this.unit.quantity.plus(number)
            return true
        }
        return false
    }
}
