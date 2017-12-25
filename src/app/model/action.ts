import { Base } from './base'
import { Cost } from './cost'
import { Unit } from 'app/model/unit';
import { Decimal } from "decimal.js"
import { Game } from 'app/model/game';

export class Action extends Base {

    realPriceNow = new Array<Cost>()
    maxBuy = new Decimal(0)
    oneTime = false
    showNumber = true
    showHide = true
    show = true
    owned = false
    public up: Action
    canBuy = false

    constructor(
        id: string,
        name, description,
        public price = new Array<Cost>(),
        public unit: Unit = null
    ) {
        super(id, name, description)
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
            this.canBuy = false
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
            this.maxBuy = max
            this.canBuy = this.maxBuy.greaterThanOrEqualTo(1)
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
    getData() {
        const data = super.getData()
        data.own = this.owned
    }
    load(data: any) {
        if (data.own)
            this.owned = data.own
    }
}

export class Buy extends Action {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null) {
        super("buy", "Hire", "Get more units", price, unit)
        this.showHide = false
        this.unlocked = true
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

export class Research extends Action {
    constructor(
        id: string,
        name: string,
        description: string,
        cost: Cost[],
        public toUnlock: Base[],
        public game: Game) {
        super(id, name, description, cost)
        this.oneTime = true
        this.showHide = false
        game.resList.push(this)
    }

    buy() {
        if (super.buy() && this.toUnlock) {
            this.game.unlockUnits(this.toUnlock)
        }
        return true
    }

}

export class BuyAndUnlock extends Buy {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null,
        public toUnlock: Array<Base>,
        public game: Game) {
        super(price, unit)
        this.showHide = false
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.game.unlockUnits(this.toUnlock)
            return true
        }
        return false
    }
}
