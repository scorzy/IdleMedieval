import { TypeList } from './typeList';
import { Production } from './production'
import { Unit } from './unit';
import { Base } from './base'
import { Decimal } from 'decimal.js';
import { Buy, Research, BuyAndUnlock } from 'app/model/action';
import { Cost } from 'app/model/cost';

export class Game {

    allMap = new Map<string, Base>()
    allArr = new Array<Base>()

    productionTable = new Array<Production>()
    activeUnits = new Array<Unit>()
    mainLists = new Array<TypeList>()
    mainListsUi = new Array<TypeList>()
    allUnit = new Array<Unit>()

    activeUnit: Unit
    buyMulti: number
    pause = false
    isLab = false
    resList = new Array<Research>()
    labTab: Base

    // region Materials
    food: Unit; wood: Unit; stone: Unit; metal: Unit; gold: Unit; science: Unit; mana: Unit
    // endregion

    //#region Workes
    hunter: Unit; student: Unit
    //#endregion

    //#region Prestige
    prestigeDone = new Decimal(0)

    //#endregion

    constructor() {
        this.labTab = new Base("labTab")
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
        this.reloadLists()
    }

    update() {
        this.activeUnits.forEach(u => {
            u.realtotalPerSec = new Decimal(0)
            u.notEnought = u.producs.length > 0
        })
        this.activeUnits.filter(u => !u.producsActive.find(prod =>
            prod.prodPerTick.lessThan(0) && prod.prodPerTick.abs().greaterThan(prod.product.quantity)
        )).forEach(u => {
            u.producsActive.forEach(prod => {
                if (!this.pause)
                    prod.product.quantity = prod.product.quantity.plus(prod.prodPerTick)
                prod.product.realtotalPerSec = prod.product.realtotalPerSec.plus(prod.prodPerTick)
                u.notEnought = false
            })
        })
        this.activeUnits.forEach(u => u.realtotalPerSec = u.realtotalPerSec.times(5))
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
    reloadLists() {
        this.mainLists.forEach(l => l.reload())
        this.mainListsUi = this.mainLists.filter(ml => ml.uiList.length > 0)
    }

    unlockUnits(toUnlock: Array<Base>) {
        let ok = false
        toUnlock.filter(u => u.avabileThisWorld).forEach(u => {
            ok = ok || (!u.unlocked)
            u.unlocked = true
            u.isNew = true
            if (u instanceof Unit && u.buyAction)
                u.buyAction.unlocked = true

        })
        if (!ok)
            return false

        this.allUnit.filter(u => u.unlocked).forEach(u2 => u2.producs.forEach(p => {
            const isN = p.product.unlocked
            p.product.unlocked = p.product.avabileThisWorld
            p.product.isNew = (!isN && p.product.unlocked) || p.product.isNew

        }))
        this.activeUnits = this.allUnit.filter(u => u.unlocked)
        this.reloadLists()

        return ok
    }

    initResouces() {
        this.food = new Unit("food", "Food", "Food descriptio")
        this.wood = new Unit("wood", "Wood", "Wood descriptio")
        this.stone = new Unit("stone", "Stone", "Stone descriptio")
        this.metal = new Unit("metal", "Metal", "Metal descriptio")
        this.gold = new Unit("gold", "Gold", "Gold descriptio")
        this.science = new Unit("science", "Science", "Science descriptio")
        this.mana = new Unit("mana", "Mana", "Mana descriptio")

        const matList = new TypeList("Materials")
        matList.list.push(this.food, this.wood, this.stone, this.metal, this.science, this.mana)
        this.mainLists.push(matList)
    }
    initWorkers() {
        //    Student
        this.student = new Unit("student", "Student", "Student description")
        this.student.actions.push(new BuyAndUnlock([new Cost(this.food, new Decimal(10))], this.student,
            [this.science, this.labTab], this))
        this.productionTable.push(new Production(this.student, this.science, new Decimal(1)))
        this.productionTable.push(new Production(this.student, this.food, new Decimal(-1)))

        //    Hunter
        this.hunter = new Unit("hunter", "Hunter", "Hunter description")
        this.hunter.unlocked = true
        this.hunter.quantity = new Decimal(1)
        this.productionTable.push(new Production(this.hunter, this.food, new Decimal(1)))
        const buyHunter = new BuyAndUnlock([new Cost(this.food, new Decimal(10))], this.hunter,
            [this.student], this)
        buyHunter.unlocked = true
        this.hunter.actions.push(buyHunter)

        const workList = new TypeList("Workers")
        workList.list.push(this.hunter, this.student)
        this.mainLists.push(workList)
    }

}
