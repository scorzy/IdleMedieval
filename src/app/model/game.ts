import { Malus } from './types';
import { BoostAction, HireAction, Action, ActiveBonus, Prestige } from './action'
import { TypeList } from './typeList'
import { Production } from './production'
import { Unit } from './unit'
import { Base } from './base'
import { Buy, Research, BuyAndUnlock, KingOrder } from 'app/model/action'
import { Cost } from 'app/model/cost'
import { EventEmitter } from '@angular/core'
import { Type } from '@angular/core/src/type'
import { Races } from 'app/model/types'
import { Bonus } from 'app/model/bonus'
import { Village } from 'app/model/village'
import * as Decimal from 'break_infinity.js'
import { PrestigeGroupModel } from './prestigeGroupModel'
export class Game {
    gameVersion = "0.0.0"

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
    isOrd = true
    resList = new Array<Research>()
    labTab: Base
    vilTab: Base
    ordTab: Base
    travelTab: Base
    prestTab: Base
    spellTab: Base
    tabList = new Array<Base>()

    // region Materials
    food: Unit; wood: Unit; stone: Unit; metal: Unit; gold: Unit; science: Unit; mana: Unit
    matList: TypeList
    // endregion
    // region Workes
    hunter: Unit; student: Unit; lumberjack: Unit; miner: Unit; quarrymen: Unit; mage: Unit; blacksmith: Unit
    soldier: Unit; templar: Unit
    // endregion
    // region Researchs
    team1: Research; team2: Research; hire: Research; woodRes: Research
    // endregion
    // region Buldings
    huntCamp: Unit; university: Unit; woodCamp: Unit; cave: Unit; mine: Unit; mageTower: Unit; forge: Unit
    // endregion
    // region Prestige
    prestigeDone = new Decimal(0)
    honor: Unit
    honorInactive: Unit
    prestigeGrups = new Array<PrestigeGroupModel>()
    // region prestige Up
    teamPrestige: Action
    hirePrestige: Action

    // endregion
    //#endregion
    // region Costs
    buyExp = new Decimal(1.1)
    buyExpUnit = new Decimal(1)
    scienceCost1 = new Decimal(100)
    scienceCost2 = new Decimal(1E3)
    scienceCost3 = new Decimal(1E4)
    scienceCost4 = new Decimal(1E5)
    expTeam = new Decimal(4)
    expHire = new Decimal(6)
    // endregion
    // region Malus
    thief: Unit; masterThief: Unit; thiefGuild: Unit; thievesList = new Array<Unit>()
    zombie: Unit; lordZombie: Unit; zombieLich: Unit; zombieList = new Array<Unit>()
    malusLists = new Array<Array<Unit>>()
    // endregion

    village: Village
    nextVillage = new Array<Village>()

    constructor() {
        this.labTab = new Base("labTb", "", "", this)
        this.vilTab = new Base("vilTb", "", "", this)
        this.ordTab = new Base("ordTb", "", "", this)
        this.travelTab = new Base("trvTb", "", "", this)
        this.prestTab = new Base("prtTb", "", "", this)
        this.spellTab = new Base("spelTb", "", "", this)
        this.tabList.push(this.labTab, this.vilTab, this.ordTab, this.travelTab, this.prestTab, this.spellTab)
        this.honor = new Unit("honor", "Honor", "Honor", this)
        this.honorInactive = new Unit("hoIna", "Inactive Honor", "Inactive Honor", this)
        this.honor.prestige = true
        this.honorInactive.prestige = true

        this.initResouces()
        this.initMalus()
        this.initWorkers()
        this.initBuldings()
        this.initResearchs()
        this.initPrestige()
        this.init()
        this.allUnit.forEach(u => u.reloadProdTable())

        this.village = new Village("Tutorial Village", [Races[0]])
        this.village.kingOrders = [
            new KingOrder("1", this.gold, this),
            new KingOrder("2", this.metal, this)
        ]
        this.village.malus = []

        this.worldReset()
        this.initRace(Races[0])
        this.reloadAll()
        this.setRandomVillage(true)

        this.goToWorld(this.village, true)

        this.matList.list.forEach(m => m.quantity = new Decimal(1E20))
    }

    init() {
        this.food.unlocked = true
        this.mainLists.forEach(u => u.reload())
        this.activeUnits = this.allUnit.filter(u => u.unlocked && !u.prestige)
        this.allArr = Array.from(this.allMap.values())
        this.productionTable.forEach(p => p.reload())
        this.reloadLists()
    }
    update() {
        this.activeUnits.forEach(u => {
            u.realtotalPerSec = new Decimal(0)
            u.notEnought = u.producs.length > 0
        })
        this.activeUnits.filter(u => u.productionIndep || !u.producsActive.find(prod =>
            prod.prodPerTick.lessThan(0) && prod.prodPerTick.abs().greaterThan(prod.product.quantity)
        )).forEach(u => {
            u.producsActive.forEach(prod => {
                const p = prod.prodPerTick
                if (!this.pause)
                    prod.product.quantity = prod.product.quantity.plus(p)

                prod.product.realtotalPerSec = prod.product.realtotalPerSec.plus(p)
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
            u.quantity = Decimal.max(u.quantity, 0)
            u.reloadProd()
            u.reloadBoost()
            u.totalProducers = new Decimal(u.madeByActive.length)
            u.totalPerSec = new Decimal(0)
            u.madeByActive.forEach(p =>
                u.totalPerSec = u.totalPerSec.plus(p.prodPerSec.times(p.productor.quantity))
            )
            u.actions.forEach(a => a.reloadMaxBuy())
            u.avActions = u.actions.filter(a => a.unlocked)
            u.showUp = u.boostAction && u.boostAction.show && u.boostAction.maxBuy.greaterThanOrEqualTo(1) ||
                u.hireAction && u.hireAction.show && u.hireAction.maxBuy.greaterThanOrEqualTo(1)
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
        this.worldReset()
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
            this.village.loadData(data.v, this)
        this.reloadAll()
    }
    reloadAll() {
        this.activeUnits = this.allUnit.filter(u => u.unlocked && !u.prestige)
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
            if (u instanceof Bonus && u.activeAction)
                u.activeAction.unlocked = true

        })
        if (!ok)
            return false

        this.allUnit.filter(u => u.unlocked)
            .forEach(u2 => u2.producs.filter(pro => !pro.product.malus).forEach(p => {
                const isN = p.product.unlocked
                p.product.unlocked = p.product.avabileThisWorld
                p.product.isNew = (!isN && p.product.unlocked) || p.product.isNew
            }))
        this.activeUnits = this.allUnit.filter(u => u.unlocked && !u.prestige)
        this.activeUnits.forEach(u => {
            u.reloadProdTable()
            u.reloadBoost()
        })
        this.reloadLists()

        return ok
    }

    worldReset() {
        this.allArr.filter(u => !u.prestige).forEach(b => {
            b.isNew = false
            b.avabileThisWorld = false
            b.quantity = new Decimal(0)
            b.unlocked = false
        })
        this.allUnit.filter(u => !u.prestige).forEach(u => {
            u.percentage = 100
            u.showUp = false
            u.totalPerSec = new Decimal(0)
            u.totalProducers = new Decimal(0)
            u.realtotalPerSec = new Decimal(0)
            u.notEnought = false
            u.actions.forEach(a => a.owned = false)
            u.worldBonus = new Decimal(0)
        })
        this.productionTable.forEach(p => p.unlocked = p.defUnlocked)
        this.matList.list.forEach(mat => { mat.avabileThisWorld = true })
        this.resList.forEach(res => { res.owned = false })
        this.bonuList.forEach(bon => { bon.tickLeft = new Decimal(0) })
        this.labTab.avabileThisWorld = true
    }
    initRace(race: string) {
        this.allArr.filter(u => u.race === race).forEach(ra => ra.avabileThisWorld = true)
        switch (race) {
            case Races[0]:
                this.unlockUnits([this.team1, this.woodRes, this.hunter])
                this.hunter.quantity = new Decimal(1)
                break
        }
    }
    setMaxLevel() { }
    setRandomVillage(force: boolean = false) {
        this.setMaxLevel()
        if (!this.nextVillage || force)
            this.nextVillage = [
                Village.GenerateVillage(this),
                Village.GenerateVillage(this),
                Village.GenerateVillage(this)
            ]
        else
            for (let i = 0; i < 3; i++)
                if (!this.nextVillage[i].keep)
                    this.nextVillage[i] = Village.GenerateVillage(this)

        for (let i = 0; i < 3; i++)
            this.nextVillage[i].id = "" + i

    }
    goToWorld(village: Village, first = false) {
        this.honor.quantity = this.honor.quantity.plus(this.honorInactive.quantity)
        this.honorInactive.quantity = new Decimal(0)
        this.worldReset()
        this.village = village
        if (!first)
            this.tabList.forEach(t => t.unlocked = true)
        this.village.avaiableRaces.forEach(r => this.initRace(r))
        this.unlockUnits(this.village.startingStuff.map(t => t[0]))
        this.village.startingStuff.forEach(st => st[0].quantity = st[1])
        this.unlockUnits(this.village.avaiableStuff)
        this.village.gainMulti.forEach(g => g[0].worldBonus = g[1])

        village.malus.forEach(ma => {
            const malusIndex = Malus.indexOf(ma)
            if (malusIndex > -1) {
                const malusListTemp = this.malusLists[malusIndex]
                malusListTemp[0].quantity = village.level
                if (village.level.greaterThanOrEqualTo(10)) {
                    malusListTemp[1].quantity = Decimal.log10(village.level)
                    if (village.level.greaterThanOrEqualTo(100))
                        malusListTemp[2].quantity = Decimal.log10(malusListTemp[1].quantity)
                }
                this.unlockUnits(malusListTemp.filter(u => u.quantity > 0))
            }
        })

        this.prestigeGrups.forEach(pg => pg.actions.forEach(a => {
            a.reloadMaxBuy()
            a.reloadStrings()
        }))
    }

    // region stuff
    initResouces() {
        this.food = new Unit("food", "Food", "Food descriptio", this)
        this.wood = new Unit("wood", "Wood", "Wood descriptio", this)
        this.stone = new Unit("stone", "Stone", "Stone descriptio", this)
        this.metal = new Unit("metal", "Metal", "Metal descriptio", this)
        this.gold = new Unit("gold", "Gold", "Gold descriptio", this)
        this.science = new Unit("science", "Science", "Science descriptio", this)
        this.mana = new Unit("mana", "Mana", "Mana descriptio", this)

        this.matList = new TypeList("Materials")
        this.matList.list.push(this.food, this.wood, this.stone, this.metal, this.science, this.mana, this.gold)
        this.mainLists.push(this.matList)
    }
    initWorkers() {
        //    Templar
        this.templar = new Unit("soldier", "Soldier", "Soldier description", this)
        this.productionTable.push(new Production(this.templar, this.thief, new Decimal(-1), this))
        this.productionTable.push(new Production(this.templar, this.zombie, new Decimal(-3), this))
        this.templar.productionIndep = true
        this.templar.createBuy([new Cost(this.food, new Decimal(200)), new Cost(this.gold, new Decimal(50))])
        this.templar.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.templar.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Soldier
        this.soldier = new Unit("soldier", "Soldier", "Soldier description", this)
        this.productionTable.push(new Production(this.soldier, this.thief, new Decimal(-1), this))
        this.productionTable.push(new Production(this.soldier, this.zombie, new Decimal(-1), this))
        this.soldier.productionIndep = true
        this.soldier.createBuy([new Cost(this.food, new Decimal(100))])
        this.soldier.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.soldier.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Blacksmith
        this.blacksmith = new Unit("blacksmith", "Blacksmith", "Blacksmith description", this)
        this.productionTable.push(new Production(this.blacksmith, this.gold, new Decimal(1), this))
        this.productionTable.push(new Production(this.blacksmith, this.metal, new Decimal(-4), this))
        this.blacksmith.createBuy([new Cost(this.food, new Decimal(30)), new Cost(this.metal, new Decimal(15))])
        this.blacksmith.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.blacksmith.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Mage
        this.mage = new Unit("mage", "Mage", "Mage description", this)
        this.productionTable.push(new Production(this.mage, this.mana, new Decimal(1), this))
        this.productionTable.push(new Production(this.mage, this.food, new Decimal(-4), this))
        this.productionTable.push(new Production(this.mage, this.science, new Decimal(-1), this))
        this.mage.createBuy([new Cost(this.food, new Decimal(30))])
        this.mage.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.mage.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Miner
        this.miner = new Unit("miner", "Miner", "Miner description", this)
        this.productionTable.push(new Production(this.miner, this.metal, new Decimal(1), this))
        this.productionTable.push(new Production(this.miner, this.food, new Decimal(-2), this))
        this.productionTable.push(new Production(this.miner, this.wood, new Decimal(-2), this))
        this.miner.createBuy([new Cost(this.food, new Decimal(20)), new Cost(this.wood, new Decimal(10))])
        this.miner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.miner.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Quarrymen
        this.quarrymen = new Unit("quar", "Quarrymen", "Quarrymen description", this)
        this.productionTable.push(new Production(this.quarrymen, this.stone, new Decimal(1), this))
        this.productionTable.push(new Production(this.quarrymen, this.food, new Decimal(-2), this))
        this.productionTable.push(new Production(this.quarrymen, this.wood, new Decimal(-1), this))
        this.quarrymen.createBuy([new Cost(this.food, new Decimal(20)), new Cost(this.wood, new Decimal(5))])
        this.quarrymen.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.quarrymen.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Lumberjack
        this.lumberjack = new Unit("lumb", "Lumberjack", "Lumberjack description", this)
        this.productionTable.push(new Production(this.lumberjack, this.wood, new Decimal(1), this))
        this.productionTable.push(new Production(this.lumberjack, this.food, new Decimal(-2), this))
        this.lumberjack.createBuy([new Cost(this.food, new Decimal(20))])
        this.lumberjack.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.lumberjack.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Student
        this.student = new Unit("student", "Student", "Student description", this)
        this.student.actions.push(new BuyAndUnlock([new Cost(this.food, new Decimal(20))], this.student,
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
        workList.list.push(this.hunter, this.student, this.lumberjack, this.quarrymen, this.miner, this.mage, this.blacksmith)
        this.mainLists.push(workList)
    }
    initBuldings() {
        //    Forge
        this.forge = new Unit("forge", "Forge", "Forge description", this)
        this.productionTable.push(new Production(this.forge, this.blacksmith, new Decimal(1), this))
        this.productionTable.push(new Production(this.forge, this.gold, new Decimal(-4), this))
        this.forge.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3)),
        new Cost(this.metal, new Decimal(500))])
        this.forge.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.forge.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Mage Tower
        this.mageTower = new Unit("mageTower", "Mage Tower", "Mage Tower description", this)
        this.productionTable.push(new Production(this.mageTower, this.mage, new Decimal(1), this))
        this.productionTable.push(new Production(this.mageTower, this.gold, new Decimal(-4), this))
        this.mageTower.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3))])
        this.mageTower.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.mageTower.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Mine
        this.mine = new Unit("mine", "Mine", "mine description", this)
        this.productionTable.push(new Production(this.mine, this.miner, new Decimal(1), this))
        this.productionTable.push(new Production(this.mine, this.gold, new Decimal(-4), this))
        this.mine.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3))])
        this.mine.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.mine.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Cave
        this.cave = new Unit("cave", "Cave", "Cave description", this)
        this.productionTable.push(new Production(this.cave, this.quarrymen, new Decimal(1), this))
        this.productionTable.push(new Production(this.cave, this.gold, new Decimal(-4), this))
        this.cave.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        this.cave.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.cave.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Wood Camp
        this.woodCamp = new Unit("woodCamp", "Wood Camp", "Wood Camp description", this)
        this.productionTable.push(new Production(this.woodCamp, this.lumberjack, new Decimal(1), this))
        this.productionTable.push(new Production(this.woodCamp, this.gold, new Decimal(-4), this))
        this.woodCamp.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        this.woodCamp.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.woodCamp.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    University
        this.university = new Unit("university", "University", "University description", this)
        this.productionTable.push(new Production(this.university, this.student, new Decimal(1), this))
        this.productionTable.push(new Production(this.university, this.gold, new Decimal(-4), this))
        this.university.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        this.university.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.university.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        //    Hunt Camp
        this.huntCamp = new Unit("huntCamp", "Hunt Camp", "Hunt Camp description", this)
        this.productionTable.push(new Production(this.huntCamp, this.hunter, new Decimal(1), this))
        this.productionTable.push(new Production(this.huntCamp, this.gold, new Decimal(-4), this))
        this.huntCamp.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(500))])
        this.huntCamp.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.huntCamp.createHire([new Cost(this.science, this.scienceCost1, this.expTeam)])

        const buildList = new TypeList("Buildings")
        buildList.list.push(this.huntCamp, this.university, this.woodCamp, this.cave, this.mine, this.mageTower, this.forge)
        this.mainLists.push(buildList)
    }
    initResearchs() {
        // region boost and hire
        const allHumanHire = this.allUnit.filter(u => u.race === Races[0] && u.hireAction).map(u2 => u2.hireAction)
        this.hire = new Research("hire", "Hiring", "Team Work",
            [new Cost(this.science, new Decimal(10))], allHumanHire, this)

        const allHumanBoost = this.allUnit.filter(u => u.race === Races[0] && u.boostAction).map(u2 => u2.boostAction)
        this.team2 = new Research("te2", "Team Work 2", "Team Work",
            [new Cost(this.science, new Decimal(10))], allHumanBoost.concat(this.hire), this)

        this.team1 = new Research("te1", "Team Work", "Team Work",
            [new Cost(this.science, new Decimal(10))], [this.team2], this)
        // endregion

        // region bonus
        // region active
        const calth = new Bonus("calth", "Call to Arms",
            "x10 gold from blacksmiths x forge; 20 sec",
            this, new Decimal(10), this.forge, false)
        calth.createActiveAct(new Decimal(1), new Decimal(80))
        const calthRes = new Research("calthRes", calth.name, calth.description,
            [new Cost(this.science, new Decimal(1))], [calth], this)
        this.blacksmith.producs[0].bonus.push(calth)

        const bigHunt = new Bonus("bHuB", "Big Hunt",
            "x10 food from hunters; 20 sec",
            this, new Decimal(10), null, false)
        bigHunt.createActiveAct(new Decimal(100), new Decimal(80))
        const bigHuntRes = new Research("bHuRe", bigHunt.name, bigHunt.description,
            [new Cost(this.science, new Decimal(1))], [bigHunt], this)
        this.hunter.producs[0].bonus.push(bigHunt)
        // endregion
        // region passive
        const science1Bon = new Bonus("si1B", "Even Better Hunters",
            "Make hunter even better; +100% food from hunters", this, new Decimal(1), null, true)
        const science1Res = new Research("si1R", science1Bon.name, science1Bon.description,
            [new Cost(this.science, new Decimal(2))], [science1Bon], this)
        this.science.bonus.push(science1Bon)

        const hunterBonus2 = new Bonus("hb2B", "Even Better Hunters",
            "Make hunter even better; +100% food from hunters", this, new Decimal(1), null, true)
        const betterHunting2 = new Research("hb2R", hunterBonus2.name, hunterBonus2.description,
            [new Cost(this.science, new Decimal(1))], [hunterBonus2], this)
        this.hunter.producs[0].bonus.push(hunterBonus2)

        const hunterBonus = new Bonus("bh1R", "Smart Hunters",
            "Make hunter more usefull; +100% food from hunters", this, new Decimal(1), null, true)
        const betterHunting = new Research("bh1R", hunterBonus.name, hunterBonus.description,
            [new Cost(this.science, new Decimal(1))], [hunterBonus, betterHunting2], this)
        this.hunter.producs[0].bonus.push(hunterBonus)
        // endregion
        // endregion

        // region Buldings
        const templarRes = new Research("orderRes", "Templars", "Templars",
            [new Cost(this.science, new Decimal(10))], [this.templar], this)
        const soldierRes = new Research("orderRes", "Soldiers", "Soldiers",
            [new Cost(this.science, new Decimal(10))], [templarRes, this.soldier], this)

        const buldings = new Research("woodBRes", "Woodcutting Camp", "Woodcutting Camp",
            [new Cost(this.science, new Decimal(10))],
            [calthRes, this.woodCamp, this.cave, this.huntCamp, this.university, this.mine, this.mageTower, this.forge, soldierRes], this)
        // endregion

        // region Workers
        const orderRes = new Research("orderRes", "Orders", "Orders",
            [new Cost(this.science, new Decimal(10))], [this.honor, this.ordTab, this.vilTab, this.travelTab, buldings], this)

        const blackRes = new Research("blackRes", "Blacksmitting", "Blacksmitting",
            [new Cost(this.science, new Decimal(10))], [this.blacksmith, this.gold, orderRes], this)

        const manaRes = new Research("manaRes", "Mana", "Mana",
            [new Cost(this.science, new Decimal(10))], [this.mage, this.mana, blackRes, bigHuntRes, this.spellTab], this)

        const metalRes = new Research("meRe", "Metal", "Metal",
            [new Cost(this.science, new Decimal(10))], [this.miner, this.metal, manaRes, science1Res], this)

        const stoneRes = new Research("stoRe", "Quarry", "Quarry",
            [new Cost(this.science, new Decimal(10))], [this.quarrymen, this.stone, metalRes, betterHunting], this)

        this.woodRes = new Research("woRe", "Woodcutting", "Woodcutting",
            [new Cost(this.science, new Decimal(10))], [this.lumberjack, this.wood, stoneRes], this)
        // endregion
    }
    initMalus() {
        // region    Thieves
        this.thief = new Unit("thief", "Thief", "Thief descriptio", this)
        this.masterThief = new Unit("msThief", "Thief", "Thief descriptio", this)
        this.thiefGuild = new Unit("thiefGuild", "Thief", "Thief descriptio", this)
        this.productionTable.push(new Production(this.thief, this.gold, new Decimal(-1), this))
        this.productionTable.push(new Production(this.masterThief, this.thief, new Decimal(1), this))
        this.productionTable.push(new Production(this.thiefGuild, this.masterThief, new Decimal(1), this))

        const thievesTypeList = new TypeList("Thieves")
        thievesTypeList.list = [this.thief, this.masterThief, this.thiefGuild]
        this.thievesList = thievesTypeList.list
        this.mainLists.push(thievesTypeList)
        // endregion
        // region    Zombie
        this.zombie = new Unit("zombie", "Zombie", "Zombie descriptio", this)
        this.lordZombie = new Unit("lordZombie", "Lord Zombie", "Lord Zombie descriptio", this)
        this.zombieLich = new Unit("zombieLich", "Lich Zombie", "Lich Zombie descriptio", this)
        this.productionTable.push(new Production(this.zombie, this.food, new Decimal(-1), this))
        this.productionTable.push(new Production(this.lordZombie, this.zombie, new Decimal(1), this))
        this.productionTable.push(new Production(this.zombieLich, this.lordZombie, new Decimal(1), this))

        const zombieTypeList = new TypeList("Zombies")
        zombieTypeList.list = [this.zombie, this.lordZombie, this.zombieLich]
        this.zombieList = zombieTypeList.list
        this.mainLists.push(zombieTypeList)
        // endregion
        this.malusLists = [this.zombieList, this.thievesList]
        this.malusLists.forEach(l => l.forEach(m => {
            m.alwaysOn = true
            m.malus = true
        }))
    }
    initPrestige() {
        this.teamPrestige = new Prestige("te", "Team Bonus", "+20% team bonus", this)
        this.hirePrestige = new Prestige("hi", "Retroactive Hire", "+5% team bonus", this)
        this.hirePrestige.limit = new Decimal(20)

        this.prestigeGrups.push(new PrestigeGroupModel("bon", "Bonus", "Bonus desc", [this.teamPrestige, this.hirePrestige]))
    }
    // endregion

}
