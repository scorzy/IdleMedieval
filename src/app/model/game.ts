import { BoostAction, HireAction, Action } from './action';
import { TypeList } from './typeList';
import { Production } from './production'
import { Unit } from './unit';
import { Base } from './base'
import { Decimal } from 'decimal.js';
import { Buy, Research, BuyAndUnlock } from 'app/model/action';
import { Cost } from 'app/model/cost';
import { EventEmitter } from '@angular/core';
import { Type } from '@angular/core/src/type';
import { Race } from 'app/model/types';

export class Game {
    researchsObs: EventEmitter<number> = new EventEmitter<number>()

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
    food: Unit; wood: Unit; stone: Unit; metal: Unit; crystal: Unit; gold: Unit; science: Unit; mana: Unit
    // endregion
    // region Workes
    hunter: Unit; student: Unit; lumberjack: Unit; miner: Unit; quarrymen: Unit; mage: Unit; cryMiner: Unit
    // endregion
    // region Researchs
    team1: Research; team2: Research; hire: Research
    // endregion
    //#region Prestige
    prestigeDone = new Decimal(0)
    //#endregion
    // region costs
    buyExp = new Decimal(1.1)
    buyExpUnit = new Decimal(1)
    scienceCost1 = new Decimal(100)
    scienceCost2 = new Decimal(1E3)
    scienceCost3 = new Decimal(1E4)
    scienceCost4 = new Decimal(1E5)
    expTeam = new Decimal(4)
    expHire = new Decimal(6)
    // endregion

    constructor() {
        this.labTab = new Base("labTab")
        this.allMap.set("labTab", this.labTab)
        this.initResouces()
        this.initWorkers()
        this.init()
        this.initResearchs()
        this.allUnit.forEach(u => u.reloadProdTable())
    }

    init() {
        this.food.unlocked = true

        this.mainLists.forEach(u => u.reload())
        this.mainLists.forEach(m => m.list.forEach(u => this.allMap.set(u.id, u)))
        this.resList.forEach(r => this.allMap.set(r.id, r))
        this.allArr = Array.from(this.allMap.values())
        this.activeUnits.push(this.food, this.hunter)
        this.allUnit = this.allArr.filter(b => b instanceof Unit).map(b => <Unit>b)

        this.productionTable.forEach(p => p.reload())
        this.allUnit.forEach(u => {
            u.producs = this.productionTable.filter(p => p.productor === u)
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
        this.activeUnits.forEach(u => {
            u.reloadProd()
              u.reloadBoost()
            u.totalProducers = new Decimal(u.madeByActive.length)
            u.totalPerSec = new Decimal(0)
            u.madeByActive.forEach(p =>
                u.totalPerSec = u.totalPerSec.plus(p.prodPerSec.times(p.productor.quantity))
            )
            u.actions.forEach(a => a.reloadMaxBuy())
            u.avActions = u.actions.filter(a => a.unlocked)
            u.showUp = u.boostAction && u.boostAction.maxBuy.greaterThanOrEqualTo(1) ||
                u.hireAction && u.hireAction.maxBuy.greaterThanOrEqualTo(1)
        })
        if (this.isLab)
            this.resList.filter(r => r.unlocked).forEach(r => r.reloadMaxBuy())
        if (this.activeUnit)
            this.activeUnit.actions.forEach(a => a.reloadStrings())
    }
    getSave(): any {
        const data: any = {}
        data.un = this.allArr.map(u => u.getData())
        return data
    }
    load(data: any) {
        if (data.un) {
            data.un.forEach(e => {
                let unit: Base = null
                if (e.i) {
                    unit = this.allMap.get(e.i)
                    if (unit) {
                        unit.load(e)
                    }
                }
            })
        }
        this.activeUnits = this.allUnit.filter(u => u.unlocked)
        this.reload()
        this.reloadLists()
        this.allUnit.forEach(u => {
            u.reloadProdTable()
            u.reloadBoost()
        })
    }
    reloadLists() {
        this.mainLists.forEach(l => l.reload())
        this.mainListsUi = this.mainLists.filter(ml => ml.uiList.length > 0)
    }
    unlockUnits(toUnlock: Array<Base>) {
        if (!toUnlock)
            return false

        let ok = false
        toUnlock.filter(u => u.avabileThisWorld && !u.unlocked).forEach(u => {
            ok = ok || (!u.unlocked)
            u.unlocked = true
            u.isNew = true
            if (u instanceof Unit && u.buyAction)
                u.buyAction.unlocked = true
            if (u instanceof Action && u.unit)
                u.unit.avActions = u.unit.actions.filter(a => a.unlocked)
            if (u instanceof Unit) {
                u.producsActive = u.producs.filter(p => p.unlocked)
                u.madeByActive = u.madeBy.filter(p => p.unlocked)
            }

        })
        if (!ok)
            return false

        this.allUnit.filter(u => u.unlocked).forEach(u2 => u2.producs.forEach(p => {
            const isN = p.product.unlocked
            p.product.unlocked = p.product.avabileThisWorld
            p.product.isNew = (!isN && p.product.unlocked) || p.product.isNew
        }))
        this.activeUnits = this.allUnit.filter(u => u.unlocked)
        this.activeUnits.forEach(u => {
            u.reloadProdTable()
            u.reloadBoost()
        })
        this.reloadLists()

        return ok
    }

    initResouces() {
        this.food = new Unit("food", "Food", "Food descriptio", this)
        this.wood = new Unit("wood", "Wood", "Wood descriptio", this)
        this.stone = new Unit("stone", "Stone", "Stone descriptio", this)
        this.metal = new Unit("metal", "Metal", "Metal descriptio", this)
        this.gold = new Unit("gold", "Gold", "Gold descriptio", this)
        this.science = new Unit("science", "Science", "Science descriptio", this)
        this.mana = new Unit("mana", "Mana", "Mana descriptio", this)
        this.crystal = new Unit("cry", "Crystall", "Crystall descriptio", this)

        const matList = new TypeList("Materials")
        matList.list.push(this.food, this.wood, this.stone, this.metal, this.crystal, this.science, this.mana)
        this.mainLists.push(matList)
    }
    initWorkers() {
        //    cryMiner
        this.cryMiner = new Unit("cryMin", "Crystal Miner", "Crystal Miner description", this)
        this.productionTable.push(new Production(this.cryMiner, this.crystal, new Decimal(1)))
        this.productionTable.push(new Production(this.cryMiner, this.food, new Decimal(-2)))
        this.cryMiner.createBuy([new Cost(this.food, new Decimal(10))])
        this.cryMiner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.cryMiner.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    quarrymen
        this.quarrymen = new Unit("quar", "Quarrymen", "Quarrymen description", this)
        this.productionTable.push(new Production(this.quarrymen, this.stone, new Decimal(1)))
        this.productionTable.push(new Production(this.quarrymen, this.food, new Decimal(-2)))
        this.quarrymen.createBuy([new Cost(this.food, new Decimal(10))])
        this.quarrymen.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.quarrymen.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Mage
        this.mage = new Unit("mage", "Mage", "Mage description", this)
        this.productionTable.push(new Production(this.mage, this.mana, new Decimal(1)))
        this.productionTable.push(new Production(this.mage, this.food, new Decimal(-2)))
        this.mage.createBuy([new Cost(this.food, new Decimal(10))])
        this.mage.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.mage.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Miner
        this.miner = new Unit("miner", "Miner", "Miner description", this)
        this.productionTable.push(new Production(this.miner, this.metal, new Decimal(1)))
        this.productionTable.push(new Production(this.miner, this.food, new Decimal(-2)))
        this.miner.createBuy([new Cost(this.food, new Decimal(10))])
        this.miner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.miner.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Lumberjack
        this.lumberjack = new Unit("lumb", "Lumberjack", "Lumberjack description", this)
        this.productionTable.push(new Production(this.lumberjack, this.wood, new Decimal(1)))
        this.productionTable.push(new Production(this.lumberjack, this.food, new Decimal(-2)))
        this.lumberjack.createBuy([new Cost(this.food, new Decimal(10))])
        this.lumberjack.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.lumberjack.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Student
        this.student = new Unit("student", "Student", "Student description", this)
        this.student.actions.push(new BuyAndUnlock([new Cost(this.food, new Decimal(10))], this.student,
            [this.science, this.labTab], this))
        this.productionTable.push(new Production(this.student, this.science, new Decimal(1)))
        this.productionTable.push(new Production(this.student, this.food, new Decimal(-2)))
        this.student.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.student.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Hunter
        this.hunter = new Unit("hunter", "Hunter", "Hunter description", this)
        this.hunter.unlocked = true
        this.hunter.quantity = new Decimal(1)
        this.productionTable.push(new Production(this.hunter, this.food, new Decimal(1)))
        const buyHunter = new BuyAndUnlock([new Cost(this.food, new Decimal(10))], this.hunter,
            [this.student], this)
        buyHunter.unlocked = true
        this.hunter.actions.push(buyHunter)
        this.hunter.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.hunter.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        const workList = new TypeList("Workers")
        workList.list.push(this.hunter, this.student, this.lumberjack, this.quarrymen, this.miner, this.cryMiner, this.mage)
        this.mainLists.push(workList)
    }
    initResearchs() {
        // region boost and hire
        const allHumanHire = this.allUnit.filter(u => u.race === Race.human && u.hireAction).map(u2 => u2.hireAction)
        this.hire = new Research("hire", "Hiring", "Team Work",
            [new Cost(this.science, new Decimal(10))], allHumanHire, this)

        const allHumanBoost = this.allUnit.filter(u => u.race === Race.human && u.boostAction).map(u2 => u2.boostAction)
        this.team2 = new Research("te2", "Team Work 2", "Team Work",
            [new Cost(this.science, new Decimal(10))], allHumanBoost.concat(this.hire), this)

        this.team1 = new Research("te1", "Team Work", "Team Work",
            [new Cost(this.science, new Decimal(10))], [this.team2], this)
        this.team1.unlocked = true
        // endregion

        const manaRes = new Research("manaRes", "Mana", "Mana",
            [new Cost(this.science, new Decimal(10))], [this.mage, this.mana], this)

        const cryRes = new Research("cryRes", "Crystal", "Crystal",
            [new Cost(this.science, new Decimal(10))], [this.cryMiner, this.crystal, manaRes], this)

        const metalRes = new Research("meRe", "Metal", "Metal",
            [new Cost(this.science, new Decimal(10))], [this.miner, this.metal, cryRes], this)

        const stoneRes = new Research("stoRe", "Quarry", "Quarry",
            [new Cost(this.science, new Decimal(10))], [this.quarrymen, this.stone, metalRes], this)

        const woodRes = new Research("woRe", "Woodcutting", "Woodcutting",
            [new Cost(this.science, new Decimal(10))], [this.lumberjack, this.wood, stoneRes], this)
        woodRes.unlocked = true
    }

}
