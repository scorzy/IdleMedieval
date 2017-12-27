import { Unit } from './unit';
import { Game } from './game';
import { Base } from './base';
import { Race } from './types'
import { Array } from 'core-js/library/web/timers'

export class Village {

    keep = false
    id = ""

    constructor(
        public name: string,
        public avaiableRaces: Array<Race>,
        public startingStuff: Array<[Base, Decimal]>,
        public avaiableStuff: Array<Base>,
        public gainMulti: Array<[Unit, Decimal]>,
    ) {

    }

    getSave() {
        const data: any = {}
        data.n = this.name
        data.r = this.avaiableRaces
        data.k = this.keep
        data.s = this.startingStuff.map(b => [b[0].id, b[1]])
        data.a = this.avaiableStuff.map(a => a.id)
        data.g = this.gainMulti.map(g => [g[0].id, g[1]])
        return data
    }
    loadData(data: any, game: Game) {
        if (data.n)
            this.name = data.n
        if (data.r)
            this.avaiableRaces = data.r
        if (data.k)
            this.keep = data.keep
        if (data.s)
            data.s.foreach(st => {
                const stuff = game.allMap.get(st[0])
                if (stuff) {
                    const num = new Decimal(st[1])
                    this.startingStuff.push([stuff, num])
                }
            })
        if (data.a)
            data.a.foreach(st => {
                const stuff = game.allMap.get(st)
                if (stuff)
                    this.avaiableStuff.push(stuff)
            })
        if (data.g)
            data.g.foreach(ga => {
                const stuff = game.allMap.get(ga[0])
                if (stuff && stuff instanceof Unit) {
                    const num = new Decimal(ga[1])
                    this.gainMulti.push([stuff, num])
                }
            })
    }
}
