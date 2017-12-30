import { Production } from './production'
import { Base } from './base'
import { Action, Buy, BoostAction, HireAction } from './action'
import { Cost } from './cost'
import * as Decimal from 'break_infinity.js'

import { Game } from 'app/model/game';
import { Bonus } from 'app/model/bonus';
export class Unit extends Base {

    actions = new Array<Action>()
    avActions = new Array<Action>()
    percentage = 100
    producs = new Array<Production>()
    madeBy = new Array<Production>()
    buyAction: Buy

    producsActive = new Array<Production>()
    madeByActive = new Array<Production>()

    showUp = false
    totalPerSec = new Decimal(0)
    totalProducers = new Decimal(0)
    realtotalPerSec = new Decimal(0)
    notEnought = false

    boost = new Decimal(1)
    boostAction: Action
    hireAction: Action

    bonus = new Array<Bonus>()
    totBonus = new Decimal(1)
    worldBonus = new Decimal(0)

    productionIndep = false
    malus = false

    constructor(
        id: string,
        name: string,
        description: string,
        game: Game
    ) {
        super(id, name, description, game)
        this.game.allUnit.push(this)
    }

    getData(): any {
        const data = super.getData()
        data.perc = this.percentage
        // data.a = this.actions.map(act => act.getData())
        return data
    }
    load(data: any) {
        super.load(data)
        if (data.perc)
            this.percentage = data.perc
    }
    isStopped() { return this.percentage < Number.EPSILON }
    reloadProd() {
        // reload total bonus
        this.totBonus = new Decimal(0)
        this.bonus.filter(b => b.isAactive()).forEach(bo =>
            this.totBonus = this.totBonus.plus(bo.getBoost()))

        this.totBonus = this.totBonus.plus(this.worldBonus)

        this.producs.forEach(p => p.reload())
    }
    reloadBoost() {
        this.boost = this.game.team1.owned && this.buyAction ?
            this.buyAction.quantity.times(0.005)
                .times(this.boostAction ? this.boostAction.quantity.plus(1) : new Decimal(1))
            : new Decimal(0)

        // prestige
        if (this.game.teamPrestige.quantity.greaterThanOrEqualTo(1))
            this.boost = this.boost.times(this.game.teamPrestige.quantity.times(0.2).plus(1))

    }
    reloadProdTable() {
        this.producsActive = this.producs.filter(p => p.unlocked && p.productor.unlocked)
        this.madeByActive = this.madeBy.filter(p => p.unlocked && p.productor.unlocked)
    }
    // region utility
    createBuy(price: Array<Cost>) {
        this.buyAction = new Buy(price, this, this.game)
        this.actions.push(this.buyAction)
    }
    createBoost(price: Array<Cost>) {
        this.boostAction = new BoostAction(price, this, this.game)
        this.actions.push(this.boostAction)
    }
    createHire(price: Array<Cost>) {
        this.hireAction = new HireAction(price, this, this.game)
        this.actions.push(this.hireAction)
    }
    // endregion
}
