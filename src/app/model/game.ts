import { TypeList } from './typeList';
import { Production } from './production'
import { Unit } from './unit';
import { Base } from './base'
import { Decimal } from 'decimal.js';
import { Buy } from 'app/model/action';
import { Cost } from 'app/model/cost';

export class Game {

    allMap = new Map<string, Base>()
    allArr = new Array<Base>()

    productionTable = new Array<Production>()
    activeUnits = new Array<Unit>()
    mainLists = new Array<TypeList>()
    allUnit = new Array<Unit>()

    activeUnit: Unit
    buyMulti: number
    pause = false

    //#region Resources
    food: Unit
    wood: Unit
    stone: Unit
    metal: Unit
    science: Unit
    mana: Unit
    //#region

    //#region Workes
    hunter: Unit
    //#region

    constructor() {
        this.initResouces()
        this.initWorkers()
        this.init()
    }

    init() {
        this.food.unlocked = true

        this.mainLists.forEach(u => u.reload())
        this.mainLists.forEach(m => m.list.forEach(u =>
            this.allMap.set(u.id, u)
        ))
        this.allArr = Array.from(this.allMap.values())
        this.activeUnits.push(this.food, this.hunter)
        this.allUnit = this.allArr.filter(b => b instanceof Unit).map(b => <Unit>b)

        this.productionTable.forEach(p => p.reload())
        this.allUnit.forEach(u => {
            u.producs = this.productionTable.filter(p => p.productor === u)
            u.producsActive = u.producs.filter(p => p.unlocked)
            u.madeBy = this.productionTable.filter(p => p.product === u)
        })
    }

    update() {
        this.activeUnits.filter(u => u.producsActive.find(prod =>
            (prod.prodPerTick.lessThan(0) && prod.prodPerTick.abs().lessThan(prod.product.quantity)) || prod.prodPerTick.greaterThan(0)
        )).forEach(u => {
            u.producsActive.forEach(prod => prod.product.quantity = prod.product.quantity.plus(prod.prodPerTick))
        })
        this.reload()
    }

    reload() {
        this.activeUnits.forEach(u => u.reloadProd())
        this.activeUnits.forEach(u => {
            u.totalProducers = new Decimal(u.madeBy.length)
            u.totalPerSec = new Decimal(0)

            u.madeBy.forEach(p =>
                u.totalPerSec = u.totalPerSec.plus(p.prodPerSec.times(p.productor.quantity))
            )
            u.actions.forEach(a => a.reloadMaxBuy())
        })
    }

    getSave(): any {
        const data: any = {}
        data.un = this.allArr.map(u => u.getData())

    }
    load(data: any) {
        if (data.un) {
            data.un.array.forEach(e => {
                let unit: Base = null
                if (e.i) {
                    unit = this.allMap.get(e.i)
                    if (unit) {
                        unit.load(e)
                    }
                }
            })
        }
    }

    initResouces() {
        this.food = new Unit("food", "Food", "Food descriptio")
        this.wood = new Unit("wood", "Wood", "Wood descriptio")
        this.stone = new Unit("stone", "Stone", "Stone descriptio")
        this.metal = new Unit("metal", "Metal", "Metal descriptio")
        this.science = new Unit("science", "Science", "Science descriptio")
        this.mana = new Unit("mana", "Mana", "Mana descriptio")

        const matList = new TypeList("Materials")
        matList.list.push(this.food, this.wood, this.stone, this.metal, this.science, this.mana)
        this.mainLists.push(matList)
    }
    initWorkers() {
        this.hunter = new Unit("hunter", "Hunter", "Hunter descriptio")
        this.hunter = new Unit("hunter", "Hunter", "Hunter descriptio")
        this.hunter.unlocked = true
        this.hunter.quantity = new Decimal(1)
        this.productionTable.push(new Production(this.hunter, this.food, new Decimal(1)))

        const buyHunter = new Buy([new Cost(this.food, new Decimal(10))], this.hunter)
        buyHunter.unlocked = true
        this.hunter.actions.push(buyHunter)

        const workList = new TypeList("Workers")
        workList.list.push(this.hunter)
        this.mainLists.push(workList)
    }

}
