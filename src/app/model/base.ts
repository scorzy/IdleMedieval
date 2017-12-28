import { Decimal } from "decimal.js"
import { Game } from "app/model/game"
import { Races } from "app/model/types";

export class Base {

    quantity = new Decimal(0)
    unlocked = false
    avabileThisWorld = true
    alwaysOn = false
    isNew = false
    race = Races[0]

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
        data.u = this.unlocked
        data.z = this.avabileThisWorld
        data.n = this.isNew
        return data
    }
    load(data: any) {
        if (data.q)
            this.quantity = new Decimal(data.q)
        if (data.u)
            this.unlocked = data.u
        if (data.z)
            this.avabileThisWorld = data.z
        if (data.n)
            this.isNew = data.n
    }
}
