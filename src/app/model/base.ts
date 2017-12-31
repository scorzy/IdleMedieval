import * as Decimal from 'break_infinity.js'
import { Game } from "app/model/game"
import { Races } from "app/model/types";

export class Base {

    quantity = new Decimal(0)
    unlocked = false
    alwaysOn = false
    isNew = false
    race = Races[0]
    prestige = false

    constructor(
        public id: string,
        public name = "",
        public description = "",
        public game: Game,
        noSet = false
    ) {
        if (!noSet)
            this.game.allMap.set(this.id, this)
    }

    getData() {
        const data: any = {}
        data.i = this.id
        data.q = this.quantity
        if (!this.prestige) {
            data.u = this.unlocked
            data.n = this.isNew
        }
        return data
    }
    load(data: any) {
        if (data.q)
            this.quantity = new Decimal(data.q)
        if (data.u)
            this.unlocked = data.u
        if (data.n)
            this.isNew = data.n
    }
}
