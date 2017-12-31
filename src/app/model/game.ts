import { Malus, Races } from './types';
import { BoostAction, HireAction, Action, ActiveBonus, Prestige } from './action'
import { TypeList } from './typeList'
import { Production } from './production'
import { Unit } from './unit'
import { Base } from './base'
import { Buy, Research, BuyAndUnlock, KingOrder } from 'app/model/action'
import { Cost } from 'app/model/cost'
import { EventEmitter } from '@angular/core'
import { Type } from '@angular/core/src/type'
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
    workList: TypeList; masterList: TypeList; guildList: TypeList; companyList: TypeList;
    // endregion
    // region Researchs
    team1: Research; team2: Research; hire: Research; woodRes: Research
    mainBuldingRes: Research; orderRes: Research
    // endregion
    // region Buldings
    huntCamp: Unit; university: Unit; woodCamp: Unit; cave: Unit; mine: Unit; mageTower: Unit; forge: Unit
    buildList: TypeList
    // endregion
    // region Prestige
    prestigeDone = new Decimal(0)
    honor: Unit
    honorInactive: Unit
    prestigeGrups = new Array<PrestigeGroupModel>()
    // region prestige Up
    teamPrestige: Action; hirePrestige: Action
    spellPrestigeTime: Action; spellPrestigePower: Action

    // endregion
    //#endregion
    // region Costs
    buyExp = new Decimal(1.1)
    buyExpUnit = new Decimal(1)
    scienceCost1 = new Decimal(100)
    scienceCost2 = new Decimal(1E3)
    scienceCost3 = new Decimal(1E4)
    scienceCost4 = new Decimal(1E5)
    scienceCost5 = new Decimal(1E6)
    expTeam = new Decimal(4)
    expHire = new Decimal(6)
    overMulti = new Decimal(-0.5)
    // endregion
    // region Malus
    thief: Unit; masterThief: Unit; thiefGuild: Unit; thievesList = new Array<Unit>()
    zombie: Unit; lordZombie: Unit; zombieLich: Unit; zombieList = new Array<Unit>()
    malusLists = new Array<Array<Unit>>()
    // endregion
    // region Mages
    mainGolemRes: Research; monk: Unit
    // endregion
    // region Dwarf
    dwarfMiner: Unit; dwarfRes: Research
    // endregion
    village: Village
    nextVillage = new Array<Village>()
    // region Methods
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
        this.initMages()
        this.initVillTypes()
        this.initDwarf()

        this.initPrestige()
        this.init()
        this.allUnit.forEach(u => u.reloadProdTable())

        this.village = new Village("Tutorial Village", [Races[0], Races[1]])
        this.village.kingOrders = [
            new KingOrder("1", this.gold, this),
            new KingOrder("2", this.metal, this)
        ]
        this.village.malus = []

        this.worldReset()
        this.initRace(Races[0])
        this.reloadAll()
        Village.generatePreset(this)
        this.setRandomVillage(true)

        this.goToWorld(this.village, true)

        this.matList.list.forEach(m => m.quantity = new Decimal(1E20))
        this.honor.quantity = new Decimal(1E20)
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
        // u.avabileThisWorld &&
        toUnlock.filter(u => !u.unlocked).forEach(u => {
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
            case Races[1]:
                this.unlockUnits([this.monk, this.mainGolemRes])
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
        this.initRace(Races[0])
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


        this.matList.list.forEach(m => m.quantity = new Decimal(1E20))
        this.honor.quantity = new Decimal(1E20)
    }
    // endregion

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
        this.templar.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Soldier
        this.soldier = new Unit("soldier", "Soldier", "Soldier description", this)
        this.productionTable.push(new Production(this.soldier, this.thief, new Decimal(-1), this))
        this.productionTable.push(new Production(this.soldier, this.zombie, new Decimal(-1), this))
        this.soldier.productionIndep = true
        this.soldier.createBuy([new Cost(this.food, new Decimal(100))])
        this.soldier.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.soldier.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Blacksmith
        this.blacksmith = new Unit("blacksmith", "Blacksmith", "Blacksmith description", this)
        this.productionTable.push(new Production(this.blacksmith, this.gold, new Decimal(1), this))
        this.productionTable.push(new Production(this.blacksmith, this.metal, new Decimal(-4), this))
        this.blacksmith.createBuy([new Cost(this.food, new Decimal(30)), new Cost(this.metal, new Decimal(15))])
        this.blacksmith.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.blacksmith.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Mage
        this.mage = new Unit("mage", "Mage", "Mage description", this)
        this.productionTable.push(new Production(this.mage, this.mana, new Decimal(1), this))
        this.productionTable.push(new Production(this.mage, this.food, new Decimal(-4), this))
        this.productionTable.push(new Production(this.mage, this.science, new Decimal(-1), this))
        this.mage.createBuy([new Cost(this.food, new Decimal(30))])
        this.mage.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.mage.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Miner
        this.miner = new Unit("miner", "Miner", "Miner description", this)
        this.productionTable.push(new Production(this.miner, this.metal, new Decimal(1), this))
        this.productionTable.push(new Production(this.miner, this.food, new Decimal(-2), this))
        this.productionTable.push(new Production(this.miner, this.wood, new Decimal(-2), this))
        this.miner.createBuy([new Cost(this.food, new Decimal(20)), new Cost(this.wood, new Decimal(10))])
        this.miner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.miner.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Quarrymen
        this.quarrymen = new Unit("quar", "Quarrymen", "Quarrymen description", this)
        this.productionTable.push(new Production(this.quarrymen, this.stone, new Decimal(1), this))
        this.productionTable.push(new Production(this.quarrymen, this.food, new Decimal(-2), this))
        this.productionTable.push(new Production(this.quarrymen, this.wood, new Decimal(-1), this))
        this.quarrymen.createBuy([new Cost(this.food, new Decimal(20)), new Cost(this.wood, new Decimal(5))])
        this.quarrymen.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.quarrymen.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Lumberjack
        this.lumberjack = new Unit("lumb", "Lumberjack", "Lumberjack description", this)
        this.productionTable.push(new Production(this.lumberjack, this.wood, new Decimal(1), this))
        this.productionTable.push(new Production(this.lumberjack, this.food, new Decimal(-2), this))
        this.lumberjack.createBuy([new Cost(this.food, new Decimal(20))])
        this.lumberjack.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.lumberjack.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Student
        this.student = new Unit("student", "Student", "Student description", this)
        this.student.actions.push(new BuyAndUnlock([new Cost(this.food, new Decimal(20))], this.student,
            [this.science, this.labTab], this))
        this.productionTable.push(new Production(this.student, this.science, new Decimal(1), this))
        this.productionTable.push(new Production(this.student, this.food, new Decimal(-2), this))
        this.student.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.student.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

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
        this.hunter.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        this.workList = new TypeList("Workers")
        this.workList.list.push(this.hunter, this.student, this.lumberjack, this.quarrymen, this.miner, this.mage, this.blacksmith)
        this.mainLists.push(this.workList)
    }
    initBuldings() {
        //    Forge
        this.forge = new Unit("forge", "Forge", "Forge description", this)
        this.productionTable.push(new Production(this.forge, this.blacksmith, new Decimal(1), this))
        this.productionTable.push(new Production(this.forge, this.gold, new Decimal(-4), this))
        this.forge.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3)),
        new Cost(this.metal, new Decimal(500))])
        this.forge.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.forge.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    Mage Tower
        this.mageTower = new Unit("mageTower", "Mage Tower", "Mage Tower description", this)
        this.productionTable.push(new Production(this.mageTower, this.mage, new Decimal(1), this))
        this.productionTable.push(new Production(this.mageTower, this.gold, new Decimal(-4), this))
        this.mageTower.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3))])
        this.mageTower.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.mageTower.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    Mine
        this.mine = new Unit("mine", "Mine", "mine description", this)
        this.productionTable.push(new Production(this.mine, this.miner, new Decimal(1), this))
        this.productionTable.push(new Production(this.mine, this.gold, new Decimal(-4), this))
        this.mine.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3))])
        this.mine.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.mine.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    Cave
        this.cave = new Unit("cave", "Cave", "Cave description", this)
        this.productionTable.push(new Production(this.cave, this.quarrymen, new Decimal(1), this))
        this.productionTable.push(new Production(this.cave, this.gold, new Decimal(-4), this))
        this.cave.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        this.cave.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.cave.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    Wood Camp
        this.woodCamp = new Unit("woodCamp", "Wood Camp", "Wood Camp description", this)
        this.productionTable.push(new Production(this.woodCamp, this.lumberjack, new Decimal(1), this))
        this.productionTable.push(new Production(this.woodCamp, this.gold, new Decimal(-4), this))
        this.woodCamp.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        this.woodCamp.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.woodCamp.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    University
        this.university = new Unit("university", "University", "University description", this)
        this.productionTable.push(new Production(this.university, this.student, new Decimal(1), this))
        this.productionTable.push(new Production(this.university, this.gold, new Decimal(-4), this))
        this.university.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        this.university.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.university.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    Hunt Camp
        this.huntCamp = new Unit("huntCamp", "Hunt Camp", "Hunt Camp description", this)
        this.productionTable.push(new Production(this.huntCamp, this.hunter, new Decimal(1), this))
        this.productionTable.push(new Production(this.huntCamp, this.gold, new Decimal(-4), this))
        this.huntCamp.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.stone, new Decimal(500))])
        this.huntCamp.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.huntCamp.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        this.buildList = new TypeList("Buildings")
        this.buildList.list.push(this.huntCamp, this.university, this.woodCamp, this.cave, this.mine, this.mageTower, this.forge)
        this.mainLists.push(this.buildList)
    }
    initOver() {
        this.masterList = new TypeList("Masters")
        this.guildList = new TypeList("Guild")
        this.companyList = new TypeList("Company")
        this.mainLists.push(this.masterList, this.guildList, this.companyList)

        this.mainBuldingRes =
            this.createOver([this.workList, this.buildList, this.masterList, this.guildList, this.companyList],
                ".", "", this.orderRes)
    }
    initResearchs() {
        // region boost and hire
        const allHumanHire = this.allUnit.filter(u => u.hireAction).map(u2 => u2.hireAction)
        this.hire = new Research("hire", "Hiring", "Team Work",
            [new Cost(this.science, new Decimal(1E4))], allHumanHire, this)

        const allHumanBoost = this.allUnit.filter(u => u.boostAction).map(u2 => u2.boostAction)
        this.team2 = new Research("te2", "Team Work 2", "Team Work",
            [new Cost(this.science, new Decimal(500))], allHumanBoost.concat(this.hire), this)

        this.team1 = new Research("te1", "Team Work", "Team Work",
            [new Cost(this.science, new Decimal(200))], [this.team2], this)
        // endregion

        // region bonus
        // region active
        const calth = new Bonus("calth", "Call to Arms",
            "x10 gold from blacksmiths x forge; 20 sec",
            this, new Decimal(10), this.forge, false, "gold from blacksmiths x forge")
        calth.createActiveAct(new Decimal(1), new Decimal(80))
        const calthRes = new Research("calthRes", calth.name, calth.description,
            [new Cost(this.science, new Decimal(1))], [calth], this)
        this.blacksmith.producs[0].bonus.push(calth)

        const bigHunt = new Bonus("bHuB", "Big Hunt",
            "x10 food from hunters; 20 sec",
            this, new Decimal(10), null, false, "food from hunters")
        bigHunt.createActiveAct(new Decimal(100), new Decimal(80))
        const bigHuntRes = new Research("bHuRe", bigHunt.name, bigHunt.description,
            [new Cost(this.science, new Decimal(300))], [bigHunt], this)
        this.hunter.producs[0].bonus.push(bigHunt)
        // endregion
        // region passive
        const hunterBonus = new Bonus("bh1R", "Smart Hunters",
            "Make hunter more usefull; +100% food from hunters", this, new Decimal(1), null, true)
        const betterHunting = new Research("bh1R", hunterBonus.name, hunterBonus.description,
            [new Cost(this.science, new Decimal(150))], [hunterBonus], this)
        this.hunter.producs[0].bonus.push(hunterBonus)
        // endregion
        // endregion

        // region soldier
        const templarRes = new Research("orderRes", "Templars", "Templars",
            [new Cost(this.science, new Decimal(10))], [this.templar], this)
        const soldierRes = new Research("orderRes", "Soldiers", "Soldiers",
            [new Cost(this.science, new Decimal(10))], [templarRes, this.soldier], this)
        // endregion

        // region Workers
        this.orderRes = new Research("orderRes", "Orders", "Orders",
            [new Cost(this.science, new Decimal(1500))], [], this)
        this.initOver()
        this.orderRes.toUnlock.push(this.honor, this.ordTab, this.vilTab, this.travelTab, this.mainBuldingRes)

        const blackRes = new Research("blackRes", "Blacksmitting", "Blacksmitting",
            [new Cost(this.science, new Decimal(800))], [this.blacksmith, this.gold, this.orderRes], this)

        const manaRes = new Research("manaRes", "Mana", "Mana",
            [new Cost(this.science, new Decimal(400))], [this.mage, this.mana, blackRes, bigHuntRes, this.spellTab], this)

        const metalRes = new Research("meRe", "Metal", "Metal",
            [new Cost(this.science, new Decimal(200))], [this.miner, this.metal, manaRes], this)

        const stoneRes = new Research("stoRe", "Quarry", "Quarry",
            [new Cost(this.science, new Decimal(100))], [this.quarrymen, this.stone, metalRes, betterHunting], this)

        this.woodRes = new Research("woRe", "Woodcutting", "Woodcutting",
            [new Cost(this.science, new Decimal(50))], [this.lumberjack, this.wood, stoneRes], this)
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
        this.teamPrestige = new Prestige("teP", "Team Bonus", "+20% team bonus", this)
        this.hirePrestige = new Prestige("hiP", "Retroactive Hire", "+5% team bonus", this)
        this.hirePrestige.limit = new Decimal(20)
        this.prestigeGrups.push(new PrestigeGroupModel("bon", "Bonus", "Bonus desc", [this.teamPrestige, this.hirePrestige]))

        this.spellPrestigePower = new Prestige("stP", "Spell Power", "+20% spell power", this)
        this.spellPrestigeTime = new Prestige("spP", "Spell Duration", "+20% spell duration", this)
        this.prestigeGrups.push(new PrestigeGroupModel("spell", "Spell", "Spell", [this.spellPrestigePower, this.spellPrestigeTime]))
    }
    initMages() {
        const golemList = new TypeList("Golem"); this.mainLists.push(golemList)
        const apprList = new TypeList("Apprentice"); this.mainLists.push(apprList)
        const summonerList = new TypeList("Summoner"); this.mainLists.push(summonerList)
        const masterList = new TypeList("Master Summoners"); this.mainLists.push(masterList)
        const collegeList = new TypeList("College"); this.mainLists.push(collegeList)

        this.mainGolemRes = new Research(")G", "Golems", "Golems",
            [new Cost(this.science, new Decimal(100))],
            [], this)

        const golemMat = [this.wood, this.stone, this.metal]

        this.monk = new Unit("Monk", "Monk", "Ora et labora", this)
        this.productionTable.push(new Production(this.monk, this.food, new Decimal(1), this))
        this.productionTable.push(new Production(this.monk, this.mana, new Decimal(1), this))
        this.monk.createBuy([new Cost(this.food, new Decimal(50))])
        this.monk.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.monk.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        this.workList.list.push(this.monk)

        golemMat.forEach(mat => {
            const golem = new Unit(mat.id + "Gol", mat.name + " Golem", mat.name + " Golem", this)
            this.productionTable.push(new Production(golem, mat, new Decimal(1), this))
            this.productionTable.push(new Production(golem, this.mana, new Decimal(-0.1), this))
            golem.createBuy([new Cost(this.mana, new Decimal(30))])
            golem.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
            golem.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
            golemList.list.push(golem)

            const appre = new Unit(mat.id + "Ap", mat.name + " Apr.", mat.name + " Apprentice", this)
            this.productionTable.push(new Production(appre, golem, new Decimal(1), this))
            this.productionTable.push(new Production(appre, this.mana, new Decimal(-30), this))
            appre.createBuy([new Cost(this.food, new Decimal(500)), new Cost(this.mana, new Decimal(1E3))])
            appre.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
            appre.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
            apprList.list.push(appre)

            const golemRes = new Research(golem.id + "^", golem.name, golem.description,
                [new Cost(this.science, new Decimal(200))], [golem], this)
            const apprtRes = new Research(appre.id + "^", appre.name, appre.description,
                [new Cost(this.science, new Decimal(1E3))], [appre], this)

            this.mainGolemRes.toUnlock.push(golemRes)
        })
        const mainApprenticeRes = this.createOver([golemList, apprList, summonerList, masterList, collegeList],
            "à", "Mage ", this.mainGolemRes)
        this.mainGolemRes.toUnlock.push(mainApprenticeRes)

        const manaRegen = new Bonus("manaRegen", "Mana Regen",
            "x10 mana; 40 sec",
            this, new Decimal(10), null, false, "mana")
        manaRegen.createActiveAct(new Decimal(1), new Decimal(160))
        const manaRegenRes = new Research("manaRegenRes", manaRegen.name, manaRegen.description,
            [new Cost(this.science, new Decimal(1))], [manaRegen], this)
        this.mana.bonus.push(manaRegen)
        this.mainGolemRes.toUnlock.push(manaRegenRes)

        const empowerGolem = new Bonus("emGoB", "Empower Golem",
            "x10 golem earnings; 40 sec",
            this, new Decimal(10), null, false, "golem earnings")
        empowerGolem.createActiveAct(new Decimal(1E3), new Decimal(160))
        const empowerGolemRes = new Research("emGoRe", empowerGolem.name, empowerGolem.description,
            [new Cost(this.science, new Decimal(1))], [empowerGolem], this)
        golemList.list.forEach(g => g.producs[0].bonus.push(empowerGolem))
        mainApprenticeRes.toUnlock.push(empowerGolem)

    }
    initVillTypes() { }
    initDwarf() {
        const dwarfList = new TypeList("Dwarfs"); this.mainLists.push(dwarfList)
        const dwarfList2 = new TypeList("Dwarfs Buildings"); this.mainLists.push(dwarfList2)
        const dwarfList3 = new TypeList("Dwarfs Masters"); this.mainLists.push(dwarfList3)
        const dwarfList4 = new TypeList("Dwarfs Guild"); this.mainLists.push(dwarfList4)
        const dwarfList5 = new TypeList("Dwarfs Company"); this.mainLists.push(dwarfList5)

        //    region worker
        this.dwarfMiner = new Unit("dwMi", "Miner", "Dwarf Miner", this)
        this.productionTable.push(new Production(this.dwarfMiner, this.metal, new Decimal(1), this))
        this.dwarfMiner.createBuy([new Cost(this.food, new Decimal(30))])
        this.dwarfMiner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.dwarfMiner.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(this.dwarfMiner)

        const engineer = new Unit("dwEn", "Engineer", "Dwarf Engineer", this)
        this.productionTable.push(new Production(engineer, this.science, new Decimal(1), this))
        this.productionTable.push(new Production(engineer, this.metal, new Decimal(-3), this))
        this.dwarfMiner.createBuy([new Cost(this.food, new Decimal(35))])
        engineer.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        engineer.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(engineer)

        const bartender = new Unit("dwba", "Bartender", "Dwarf Bartender", this)
        this.productionTable.push(new Production(bartender, this.gold, new Decimal(1), this))
        this.productionTable.push(new Production(bartender, this.food, new Decimal(-5), this))
        this.dwarfMiner.createBuy([new Cost(this.food, new Decimal(40))])
        bartender.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        bartender.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(bartender)

        const brewer = new Unit("dwBr", "Brewer", "Dwarf Brewer", this)
        this.productionTable.push(new Production(brewer, this.food, new Decimal(1), this))
        this.productionTable.push(new Production(brewer, this.wood, new Decimal(-2), this))
        this.dwarfMiner.createBuy([new Cost(this.food, new Decimal(45))])
        brewer.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        brewer.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(brewer)
        //    endregion

        // region buildings
        const dwarfMiner2 = new Unit("dwMi2", "Mine", "Dwarf Mine", this)
        this.productionTable.push(new Production(dwarfMiner2, this.dwarfMiner, new Decimal(1), this))
        this.productionTable.push(new Production(dwarfMiner2, this.metal, new Decimal(-4), this))
        dwarfMiner2.createBuy([new Cost(this.metal, new Decimal(1E3)), new Cost(this.wood, new Decimal(200))])
        dwarfMiner2.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        dwarfMiner2.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        dwarfList2.list.push(dwarfMiner2)

        const engineer2 = new Unit("dwEnB2", "University", "Dwarf University", this)
        this.productionTable.push(new Production(engineer2, engineer, new Decimal(1), this))
        this.productionTable.push(new Production(engineer2, this.metal, new Decimal(-4), this))
        engineer2.createBuy([new Cost(this.metal, new Decimal(1E3)), new Cost(this.stone, new Decimal(500))])
        engineer2.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        engineer2.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        dwarfList2.list.push(engineer2)

        const bartender2 = new Unit("dwbaB2", "Inn", "Dwarf Inn", this)
        this.productionTable.push(new Production(bartender2, bartender, new Decimal(1), this))
        this.productionTable.push(new Production(bartender2, this.food, new Decimal(-5), this))
        bartender2.createBuy([new Cost(this.metal, new Decimal(1E3)), new Cost(this.stone, new Decimal(700))])
        bartender2.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        bartender2.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        dwarfList2.list.push(bartender2)

        const brewer2 = new Unit("dwBrB2", "Brewer", "Dwarf Brewer", this)
        this.productionTable.push(new Production(brewer2, brewer, new Decimal(1), this))
        this.productionTable.push(new Production(brewer2, this.wood, new Decimal(-5), this))
        brewer2.createBuy([new Cost(this.metal, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
        brewer2.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        brewer2.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        dwarfList2.list.push(brewer2)
        // endregion


    }
    // endregion

    createOver(lists: TypeList[], id: string, name: string, first: Research) {
        const mainCompanyRes = new Research(id + "aCoR", name + " Company", "Company",
            [new Cost(this.science, new Decimal(5E8))],
            [], this)
        const mainGuildRes = new Research(id + "aGuR", name + " Guilds", "Guilds",
            [new Cost(this.science, new Decimal(5E6))],
            [mainCompanyRes], this)
        const mainMasterRes = new Research(id + "aMaR", name + " Master", "Master",
            [new Cost(this.science, new Decimal(5E4))],
            [mainGuildRes], this)
        const mainBuldingRes = new Research(id + "aBuR", name + " Buildings", "Buildings",
            [new Cost(this.science, new Decimal(2E3))],
            [mainMasterRes], this)
        const res = [first, mainBuldingRes, mainMasterRes, mainGuildRes, mainCompanyRes]

        const lenght = lists[0].list.length
        for (let i = 0; i < lenght; i++) {
            const worker = lists[0].list[i]
            const building = lists[1].list[i]
            const master = new Unit(worker.id + "-M",
                "M. " + worker.name,
                "Master " + worker.name + " makes " + building.name, this)
            const guild = new Unit(worker.id + "-G",
                worker.name + " G.",
                worker.name + " Guild" + " make " + master.name, this)
            const company = new Unit(worker.id + "-C",
                worker.name + " C.",
                worker.name + " Company" + " make " + guild.name, this)

            this.productionTable.push(new Production(master, building, new Decimal(1), this))
            this.productionTable.push(new Production(guild, master, new Decimal(1), this))
            this.productionTable.push(new Production(company, guild, new Decimal(1), this))

            master.createBuy([new Cost(worker, new Decimal(1E3))])
            guild.createBuy([new Cost(building, new Decimal(1E3)), new Cost(this.gold, new Decimal(1E6))])
            company.createBuy([new Cost(master, new Decimal(1E3)), new Cost(this.gold, new Decimal(1E9))])

            master.createBoost([new Cost(this.science, this.scienceCost3, this.expTeam)])
            master.createHire([new Cost(this.science, this.scienceCost3, this.expTeam)])
            guild.createBoost([new Cost(this.science, this.scienceCost4, this.expTeam)])
            guild.createHire([new Cost(this.science, this.scienceCost4, this.expTeam)])
            company.createBoost([new Cost(this.science, this.scienceCost5, this.expTeam)])
            company.createHire([new Cost(this.science, this.scienceCost5, this.expTeam)])

            building.buyAction.price.forEach(p => {
                this.productionTable.push(new Production(master, p.what, p.basePrice.times(this.overMulti), this))
            })
            master.buyAction.price.forEach(p => {
                this.productionTable.push(new Production(guild, p.what, p.basePrice.times(this.overMulti), this))
            })
            guild.buyAction.price.forEach(p => {
                this.productionTable.push(new Production(company, p.what, p.basePrice.times(this.overMulti), this))
            })

            lists[2].list.push(master)
            lists[3].list.push(guild)
            lists[4].list.push(company)

            const buildRes = new Research(worker.id + "^1", building.name, building.description,
                [new Cost(this.science, new Decimal(2E3))], [building], this)
            const masterRes = new Research(worker.id + "^2", master.name, master.description,
                [new Cost(this.science, new Decimal(1E5))], [master], this)
            const guildRes = new Research(worker.id + "^3", guild.name, guild.description,
                [new Cost(this.science, new Decimal(1E7))], [guild], this)
            const compRes = new Research(worker.id + "^4", company.name, company.description,
                [new Cost(this.science, new Decimal(1E9))], [company], this)

            mainBuldingRes.toUnlock.push(buildRes)
            mainMasterRes.toUnlock.push(masterRes)
            mainGuildRes.toUnlock.push(guildRes)
            mainCompanyRes.toUnlock.push(compRes)
        }
        const prices = [new Decimal(500), new Decimal(5E3), new Decimal(5E4), new Decimal(5E6), new Decimal(5E8)]
        for (let i = 0; i < 5; i++) {
            const research = res[i]
            const list = lists[i]
            const allBonRes = new Research(id + "ù" + i, name + " Bonus", name + " Bonus",
                [new Cost(this.science, prices[i].div(2))], [], this)
            research.toUnlock.push(allBonRes)
            list.list.forEach(work => {
                const bon = new Bonus("ò" + work.id, "Better " + work.name,
                    "+100% resources from " + work.name, this, new Decimal(1), null, true)
                const bonRes = new Research("@" + work.id, bon.name, bon.description,
                    [new Cost(this.science, prices[i])], [bon], this, new Decimal(3))
                bon.unitMulti = bonRes
                work.producs[0].bonus.push(bon)
                allBonRes.toUnlock.push(bonRes)
            })
        }
        return mainBuldingRes
    }

}

