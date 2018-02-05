import { ServService } from 'app/serv.service'
import { Base } from './base'
import { Cost } from './cost'
import { Unit } from 'app/model/unit'
import * as Decimal from 'break_infinity.js'
import { Game } from 'app/model/game'
import * as numberformat from 'swarm-numberformat'
import { Bonus } from 'app/model/bonus'

export class Action extends Base {

    realPriceNow = new Array<Cost>()
    maxBuy = new Decimal(0)
    oneTime = false
    showNumber = true
    showHide = true
    show = true
    owned = false
    canBuy = false
    limit = null

    numberformat = numberformat
    buyString1 = ""
    buyStringHalf = ""
    buyStringMax = ""
    reqNum

    constructor(
        id: string,
        name, description,
        public price = new Array<Cost>(),
        public unit: Unit = null,
        game: Game,
        noSet = false
    ) {
        super((unit ? unit.id + "_" : "") + id,
            name, description, game, noSet)
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
        if (!this.unlocked || (this.oneTime && this.owned)) {
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

            if (this.limit)
                max = Decimal.min(max, this.limit.minus(this.quantity))

            this.maxBuy = max
            this.canBuy = this.maxBuy.greaterThanOrEqualTo(1)
            if (this.oneTime && this.canBuy)
                this.maxBuy = new Decimal(1)
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
            this.reloadMaxBuy()
            this.reloadStrings()
            return true
        }
        return false
    }
    getId() {
        return (this.unit ? this.unit.id + "_" : "") + this.id
    }
    getData() {
        const data = super.getData()
        data.own = this.owned
        return data
    }
    load(data: any) {
        super.load(data)
        if (data.own)
            this.owned = data.own
        this.realPriceNow = this.getCosts()
    }
    reloadStrings() {
        let reqNum = !this.game.buyMulti || this.game.buyMulti < 1 ? new Decimal(1) :
            new Decimal(Decimal.max(Decimal.min(this.game.buyMulti, this.maxBuy), 1))

        const buyMulti = this instanceof Buy && this.unit && this.unit.hireAction ?
            this.unit.hireAction.quantity.plus(1) : new Decimal(1)

        this.buyString1 = numberformat.formatShort(buyMulti.times(reqNum))
        this.buyStringHalf = numberformat.formatShort(buyMulti.times(this.maxBuy.div(2).ceil()))
        this.buyStringMax = numberformat.formatShort(buyMulti.times(this.maxBuy))
    }
}

export class Buy extends Action {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null,
        game: Game) {
        super("buy", "Hire", "Get more units", price, unit, game)
        this.showHide = false
        this.unlocked = true
        this.unit.buyAction = this
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.unit.quantity = this.unit.quantity.plus(number.times(
                this.unit.hireAction ? this.unit.hireAction.quantity.plus(1) : new Decimal(1)
            ))
            this.unit.reloadBoost()
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
        game: Game,
        times: Decimal = null) {
        super(id, name, description, cost, null, game)
        if (!times)
            this.oneTime = true
        else
            this.limit = times
        this.showHide = false
        game.resList.push(this)
    }

    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.game.unlockUnits(this.toUnlock)
            this.game.resList.forEach(r => { r.reloadMaxBuy(); r.reloadStrings() })
            this.game.researchsObs.emit(1)
            return true
        }
        return false
    }

    completed(): boolean {
        return (this.owned && !this.limit) || (this.limit && this.quantity.greaterThanOrEqualTo(this.limit))
    }

}

export class BuyAndUnlock extends Buy {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null,
        public toUnlock: Array<Base>,
        game: Game) {
        super(price, unit, game)
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

export class BoostAction extends Action {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null,
        game: Game) {
        super("boost", "Team Work", "Get a better teamWork bonus", price, unit, game)
        this.showHide = true
        this.unlocked = false
    }
}

export class HireAction extends Action {
    constructor(
        price = new Array<Cost>(),
        unit: Unit = null,
        game: Game) {
        super("hr", "Hire Bonus", "Get more unit for the same price", price, unit, game)
        this.showHide = true
        this.unlocked = false
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.unit.quantity = this.unit.quantity.plus(this.unit.buyAction.quantity
                .times(number)
                .times(this.game.hirePrestige.quantity.div(20))
            )
            return true
        }
        return false
    }
}

export class ActiveBonus extends Action {
    constructor(
        price = new Array<Cost>(),
        public bonus: Bonus = null,
        game: Game,
        public tick: Decimal) {
        super("actB_" + bonus.id, "", "", price, null, game)
        this.bonus.activeAction = this
        this.unlocked = true
    }
    reloadMaxBuy() {
        if (this.bonus.alwaysOn || !this.bonus.unlocked) {
            this.maxBuy = new Decimal(0)
            this.canBuy = false
        } else if (!this.bonus.isAactive()) {
            super.reloadMaxBuy()
            this.maxBuy = Decimal.min(1, this.maxBuy)
        } else {
            this.maxBuy = new Decimal(0)
            this.canBuy = false
        }
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.bonus.tickLeft = this.bonus.tickLeft.plus(
                this.getTickAct()
            )
            return true
        }
        return false
    }
    getTickAct() {
        return this.tick.plus(this.tick.times(0.2).times(this.game.spellPrestigeTime.quantity))
    }
}

export class KingOrder extends Action {
    constructor(
        id: string,
        material: Unit,
        game: Game
    ) {
        super("ko" + id, "King Order", "Send stuff to the king",
            [new Cost(material, new Decimal(1E6), new Decimal(1E3))],
            game.honorInactive, game, false)
        this.showHide = false
        this.unlocked = true
        this.name = material.name + " Order"
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        if (super.buy(number)) {
            this.game.honorInactive.quantity = this.game.honorInactive.quantity.plus(number.times(
                new Decimal(10).plus(this.game.village.level.div(10))
            ))
            return true
        }
        return false
    }
    fixName() {
        this.name = this.price[0].what.name + " Order"
    }
}

export class Prestige extends Action {
    constructor(
        id: string,
        name, description,
        game: Game,
        honor = new Decimal(10),
        public unit: Unit = null
    ) {
        super("*" + id, name, description, [new Cost(game.honor, honor, new Decimal(1.2))], null, game)
        this.unlocked = true
        this.prestige = true
        this.showHide = false
    }
    buy(number: Decimal = new Decimal(1)): boolean {
        const ret = super.buy(number)
        this.game.prestigeGrups.forEach(p => p.actions.forEach(a => {
            a.reloadMaxBuy()
            a.reloadStrings()
        }))
        return ret
    }
}
