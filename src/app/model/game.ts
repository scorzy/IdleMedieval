import { BoostAction, HireAction, Action, ActiveBonus } from './action';
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
import { Bonus } from 'app/model/bonus';
import { Village } from 'app/model/village';

export class Game {
    researchsObs: EventEmitter<number> = new EventEmitter<number>()

    allMap = new Map<string, Base>()
    allArr = new Array<Base>()

    productionTable = new Array<Production>()
    activeUnits = new Array<Unit>()
    mainLists = new Array<TypeList>()
    mainListsUi = new Array<TypeList>()
    allUnit = new Array<Unit>()
    bonuList = new Array<Bonus>()
    unlockedActiveBoost = new Array<Bonus>()

    activeUnit: Unit
    buyMulti = 1
    pause = false
    isLab = false
    resList = new Array<Research>()
    labTab: Base

    // region Materials
    food: Unit; wood: Unit; stone: Unit; metal: Unit; gold: Unit; science: Unit; mana: Unit
    matList: TypeList
    // endregion
    // region Workes
    hunter: Unit; student: Unit; lumberjack: Unit; miner: Unit; quarrymen: Unit; mage: Unit
    // endregion
    // region Researchs
    team1: Research; team2: Research; hire: Research
    // endregion
    //#region Prestige
    prestigeDone = new Decimal(0)
    honor: Base
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

    village: Village

    constructor() {
        this.labTab = new Base("labTab", "", "", this)
        this.honor = new Base("honor", "Honor", "honor", this)
        this.initResouces()
        this.initWorkers()
        this.initResearchs()

        this.init()
        this.allUnit.forEach(u => u.reloadProdTable())

        this.village = new Village("ciao", [Race.human], null)

    }

    init() {
        this.food.unlocked = true
        this.mainLists.forEach(u => u.reload())
        this.activeUnits.push(this.food, this.hunter)
        this.allArr = Array.from(this.allMap.values())
        this.productionTable.forEach(p => p.reload())
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
        this.bonuList.filter(b => !b.alwaysOn && b.tickLeft.greaterThan(0)).forEach(bo =>
            bo.tickLeft = Decimal.max(bo.tickLeft.minus(1), 0))
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
        this.unlockedActiveBoost.forEach(b => b.activeAction.reloadMaxBuy())
        if (this.isLab)
            this.resList.filter(r => r.unlocked).forEach(r => r.reloadMaxBuy())
        if (this.activeUnit)
            this.activeUnit.actions.forEach(a => a.reloadStrings())
    }
    getSave(): any {
        const data: any = {}
        data.un = this.allArr.map(u => u.getData())
        data.v = this.village.getSave()
        return data
    }
    load(data: any) {
        if (data.un) {
            console.log(data)
            data.un.forEach(e => {
                let base: Base = null
                if (e.i) {
                    base = this.allMap.get(e.i)
                    if (base) {
                        base.load(e)
                    }
                }
            })
        }
        if (data.v)
            this.village.loadData(data.v)
        this.reloadAll()
    }
    reloadAll() {
        this.activeUnits = this.allUnit.filter(u => u.unlocked)
        this.allUnit.forEach(u => u.avActions = u.actions.filter(a => a.unlocked))
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
        this.unlockedActiveBoost = this.bonuList.filter(b => b.unlocked && !b.alwaysOn)
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

        this.matList = new TypeList("Materials")
        this.matList.list.push(this.food, this.wood, this.stone, this.metal, this.science, this.mana)
        this.mainLists.push(this.matList)

        // const boostFood = new Bonus("bFoo", "Boost Food", "aaa", this, new Decimal(2), null, false)
        // boostFood.createActiveAct(new Decimal(15), new Decimal(100))
        // boostFood.unlocked = true
        // this.food.bonus.push(boostFood)
    }
    initWorkers() {
        //    Mage
        this.mage = new Unit("mage", "Mage", "Mage description", this)
        this.productionTable.push(new Production(this.mage, this.mana, new Decimal(1), this))
        this.productionTable.push(new Production(this.mage, this.food, new Decimal(-4), this))
        this.mage.createBuy([new Cost(this.food, new Decimal(10))])
        this.mage.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.mage.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Miner
        this.miner = new Unit("miner", "Miner", "Miner description", this)
        this.productionTable.push(new Production(this.miner, this.metal, new Decimal(1), this))
        this.productionTable.push(new Production(this.miner, this.wood, new Decimal(-1), this))
        this.productionTable.push(new Production(this.miner, this.food, new Decimal(-2), this))
        this.miner.createBuy([new Cost(this.food, new Decimal(10))])
        this.miner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.miner.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Quarrymen
        this.quarrymen = new Unit("quar", "Quarrymen", "Quarrymen description", this)
        this.productionTable.push(new Production(this.quarrymen, this.stone, new Decimal(1), this))
        this.productionTable.push(new Production(this.quarrymen, this.wood, new Decimal(-1), this))
        this.productionTable.push(new Production(this.quarrymen, this.food, new Decimal(-2), this))
        this.quarrymen.createBuy([new Cost(this.food, new Decimal(10))])
        this.quarrymen.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.quarrymen.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Lumberjack
        this.lumberjack = new Unit("lumb", "Lumberjack", "Lumberjack description", this)
        this.productionTable.push(new Production(this.lumberjack, this.wood, new Decimal(1), this))
        this.productionTable.push(new Production(this.lumberjack, this.food, new Decimal(-2), this))
        this.lumberjack.createBuy([new Cost(this.food, new Decimal(10))])
        this.lumberjack.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.lumberjack.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Student
        this.student = new Unit("student", "Student", "Student description", this)
        this.student.actions.push(new BuyAndUnlock([new Cost(this.food, new Decimal(10))], this.student,
            [this.science, this.labTab], this))
        this.productionTable.push(new Production(this.student, this.science, new Decimal(1), this))
        this.productionTable.push(new Production(this.student, this.food, new Decimal(-2), this))
        this.student.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.student.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Hunter
        this.hunter = new Unit("hunter", "Hunter", "Hunter description", this)
        this.hunter.unlocked = true
        this.hunter.quantity = new Decimal(1)
        this.productionTable.push(new Production(this.hunter, this.food, new Decimal(1), this))
        const buyHunter = new BuyAndUnlock([new Cost(this.food, new Decimal(10))], this.hunter,
            [this.student], this)
        buyHunter.unlocked = true
        this.hunter.actions.push(buyHunter)
        this.hunter.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.hunter.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        const workList = new TypeList("Workers")
        workList.list.push(this.hunter, this.student, this.lumberjack, this.quarrymen, this.miner, this.mage)
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

        const hunterBonus = new Bonus("bonBH", "Smart Hunters",
            "Make hunter more usefull; +100% food from hunters", this, new Decimal(1), null, true)
        const betterHunting = new Research("betterHunting", "Smart Hunters",
            "Make hunter more usefull; +100% food from hunters",
            [new Cost(this.science, new Decimal(1))], [hunterBonus], this)
        this.hunter.producs[0].bonus.push(hunterBonus)
        betterHunting.unlocked = true

        const manaRes = new Research("manaRes", "Mana", "Mana",
            [new Cost(this.science, new Decimal(10))], [this.mage, this.mana], this)

        const metalRes = new Research("meRe", "Metal", "Metal",
            [new Cost(this.science, new Decimal(10))], [this.miner, this.metal, manaRes], this)

        const stoneRes = new Research("stoRe", "Quarry", "Quarry",
            [new Cost(this.science, new Decimal(10))], [this.quarrymen, this.stone, metalRes], this)

        const woodRes = new Research("woRe", "Woodcutting", "Woodcutting",
            [new Cost(this.science, new Decimal(10))], [this.lumberjack, this.wood, stoneRes], this)
        woodRes.unlocked = true
    }

}
