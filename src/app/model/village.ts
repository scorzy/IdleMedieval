import { Unit } from './unit'
import { Game } from './game'
import { Base } from './base'
import { Races, Malus } from './types'
import { Cost } from 'app/model/cost'
import { KingOrder } from 'app/model/action'
import * as Decimal from 'break_infinity.js'

export const VillagePrefix = new Array<Village>()
export const VillageTypes = new Array<Village>()

export class Village {

    keep = false
    id = ""
    level = new Decimal(0)

    static GenerateVillage(game: Game): Village {
        const village = new Village()

        //    level
        game.setMaxLevel()
        const min = game.minUser
        const max = game.maxUser
        village.level = new Decimal(min + Math.floor(Math.random() * (max - min)))

        const prefix = VillagePrefix[Math.floor(Math.random() * VillagePrefix.length)]
        village.gainMulti = prefix.gainMulti
        village.name = prefix.name

        //    Bonus and Malus
        village.avaiableRaces.push(Races[Math.floor(Math.random() * Races.length)])
        village.malus.push(Malus[Math.floor(Math.random() * Malus.length)])

        //    Orders
        let unusedMat = game.matList.list
        for (let i = 0; i < 2; i++) {
            let mat = unusedMat[Math.floor(Math.random() * unusedMat.length)]
            village.kingOrders.push(new KingOrder("" + i, mat, game))
            unusedMat = unusedMat.filter(m => m !== mat)
        }

        return village
    }

    constructor(
        public name: string = "",
        public avaiableRaces: Array<string> = new Array<string>(),
        public startingStuff: Array<[Base, Decimal]> = new Array<[Base, Decimal]>(),
        public avaiableStuff: Array<Base> = new Array<Base>(),
        public gainMulti: Array<[Unit, Decimal]> = new Array<[Unit, Decimal]>(),
        public kingOrders: Array<KingOrder> = new Array<KingOrder>(),
        public malus: Array<string> = new Array<string>()
    ) {
    }

    getSave() {
        const data: any = {}
        data.vl = this.level
        data.vn = this.name
        data.vr = this.avaiableRaces
        data.vk = this.keep
        data.vs = this.startingStuff.map(b => [b[0].id, b[1]])
        data.va = this.avaiableStuff.map(a => a.id)
        data.vg = this.gainMulti.map(g => [g[0].id, g[1]])
        data.vo = this.kingOrders.map(ko => [ko.price[0].what.id, ko.quantity])
        data.vm = this.malus
        return data
    }
    loadData(data: any, game: Game) {
        if (data.vl)
            this.level = new Decimal(data.vl)
        if (data.vn)
            this.name = data.vn
        if (data.vr)
            this.avaiableRaces = data.vr
        if (data.vk)
            this.keep = data.vk
        if (data.vs && data.vs.lenght > 0)
            for (let st of data.vs) {
                const stuff = game.allMap.get(st[0])
                if (stuff) {
                    const num = new Decimal(st[1])
                    this.startingStuff.push([stuff, num])
                }
            }
        if (data.va && data.va.lenght > 0)
            for (let st of data.va) {
                const stuff = game.allMap.get(st)
                if (stuff)
                    this.avaiableStuff.push(stuff)
            }
        if (data.vg)
            for (let ga of data.vg) {
                const stuff = game.allMap.get(ga[0])
                if (stuff && stuff instanceof Unit) {
                    const num = new Decimal(ga[1])
                    this.gainMulti.push([stuff, num])
                }
            }
        if (data.vm)
            this.malus = data.vm

        if (data.vo)
            for (let i = 0; i < 3; i++)
                if (data.vo[i]) {
                    const stuff = game.allUnit.find(u => u.id === data.vo[i][0])
                    this.kingOrders[i].price[0].what = stuff
                    this.kingOrders[i].quantity = new Decimal(data.vo[i][1])
                }

        this.kingOrders.forEach(k => { k.realPriceNow = k.getCosts(); k.reloadMaxBuy(); k.reloadStrings() })

    }

    // tslint:disable-next-line:member-ordering
    static generatePreset(game: Game) {
        VillagePrefix.push(
            new Village("Hot", [], [], [],
                [[game.food, new Decimal(3)]]),
            new Village("Wooded", [], [], [],
                [[game.wood, new Decimal(3)]]),
            new Village("Petrified", [], [], [],
                [[game.stone, new Decimal(3)]]),
            new Village("Metallic", [], [], [],
                [[game.metal, new Decimal(3)]]),
            new Village("Scientific", [], [], [],
                [[game.science, new Decimal(3)]]),
            new Village("Magic", [], [], [],
                [[game.mana, new Decimal(3)]]),
            new Village("Rich", [], [], [],
                [[game.gold, new Decimal(3)]])
        )
    }

}
