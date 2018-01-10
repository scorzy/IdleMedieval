import { Malus, Races } from './types'
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
import { Options } from 'app/model/options';

export class Game {
    gameVersion = "0.0.1"

    researchsObs: EventEmitter<number> = new EventEmitter<number>()
    travelEmitter: EventEmitter<number> = new EventEmitter<number>()

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
    betterWorlds: Action
    follower = new Array<Prestige>()
    gain = new Array<Prestige>()
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
    malusLists = new Array<Array<Unit>>()
    // endregion
    // region Mages
    mainGolemRes: Research; monk: Unit
    // endregion
    // region Dwarf
    dwarfMiner: Unit; dwarfRes: Research
    // endregion
    // region Elves
    woodElf: Unit; elvesRes: Research
    // endregion
    village: Village
    nextVillage = new Array<Village>()

    minUser = 0
    maxUser = 0
    maxMax = 1
    lifePrestige = new Decimal(0)

    // region Methods
    constructor(
        public options: Options
    ) {
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
        this.initDwarf()
        this.initElves()

        this.initResBonus()
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
        Village.generatePreset(this)
        this.setRandomVillage(true)

        this.goToWorld(this.village, true)

        // this.matList.list.forEach(m => m.quantity = new Decimal(1E20))
        // this.honor.quantity = new Decimal(1E20)
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
        if (!this.pause)
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
            u.lastTotalPerSec = u.totalPerSec
            u.totalPerSec = new Decimal(0)
            u.madeByActive.forEach(p =>
                u.totalPerSec = u.totalPerSec.plus(p.prodPerSec.times(p.productor.quantity))
            )
            u.increasing = false
            u.descreasing = false
            if (u.totalPerSec.greaterThan(u.lastTotalPerSec))
                u.increasing = true
            else if (u.lastTotalPerSec.greaterThan(u.totalPerSec))
                u.descreasing = true

            u.actions.forEach(a => a.reloadMaxBuy())
            u.avActions = u.actions.filter(a => a.unlocked)
            u.showUp = u.boostAction && u.boostAction.show && u.boostAction.maxBuy.greaterThanOrEqualTo(1) ||
                u.hireAction && u.hireAction.show && u.hireAction.maxBuy.greaterThanOrEqualTo(1)
        })
        this.unlockedActiveBoost.forEach(b => b.activeAction.reloadMaxBuy())
        if (this.isLab)
            this.resList.filter(r => r.unlocked).forEach(r => { r.reloadMaxBuy(); r.reloadStrings() })
        if (this.activeUnit)
            this.activeUnit.actions.forEach(a => a.reloadStrings())
        this.mainListsUi.forEach(l => {
            l.notEnought = !!l.uiList.find(u => u.notEnought)
        })
    }
    getSave(): any {
        const data: any = {}
        data.un = this.allArr.map(u => u.getData())
        data.v = this.village.getSave()
        data.l = this.lifePrestige
        // console.log(data)
        return data
    }
    load(data: any) {
        this.worldReset()
        if (data.un) {
            // console.log(data)
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
        if (data.l)
            this.lifePrestige = new Decimal(data.l)
        this.reloadAll()
        this.village.gainMulti.forEach(g => g[0].worldBonus = g[1])

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
            if (!this.options.noNew)
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
                p.product.unlocked = true
                if (!this.options.noNew)
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
            u.actions.forEach(a => a.realPriceNow = a.getCosts())
        })
        this.productionTable.forEach(p => p.unlocked = p.defUnlocked)
        this.resList.forEach(res => { res.owned = false })
        this.bonuList.forEach(bon => { bon.tickLeft = new Decimal(0) })
    }
    initRace(race: string) {
        switch (race) {
            case Races[0]:
                this.unlockUnits([this.team1, this.woodRes, this.hunter])
                this.hunter.quantity = new Decimal(1)
                break
            case Races[1]:
                this.unlockUnits([this.monk, this.mainGolemRes])
                break
            case Races[2]:
                this.unlockUnits([this.dwarfMiner, this.dwarfRes])
                break
            case Races[3]:
                this.unlockUnits([this.elvesRes, this.woodElf])
                break
        }
    }
    setMaxLevel() {
        const m = this.lifePrestige.plus(this.honorInactive.quantity)
        this.maxMax = m.div(100).plus(1)
        this.maxUser = Decimal.min(this.maxUser, this.maxMax).floor().toNumber()
        this.minUser = Math.min(Math.max(0, this.minUser), this.maxUser)
    }
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
        this.matList.list.forEach(m => m.quantity = new Decimal(0))
        this.honor.quantity = this.honor.quantity.plus(this.honorInactive.quantity)
        this.lifePrestige = this.lifePrestige.plus(this.honorInactive.quantity)
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
        this.activeUnits = this.allUnit.filter(u => u.unlocked && !u.prestige)
        this.reload()

        // follower
        const l = this.workList.list.length
        for (let i = 0; i < l; i++) {
            const worker = this.workList.list[i]
            const follower = this.follower[i]
            worker.quantity = worker.quantity.plus(follower.quantity.times(5))
        }
        this.unlockUnits(this.workList.list.filter(u => u.quantity.greaterThanOrEqualTo(1)))
        this.setRandomVillage(true)

        // this.matList.list.forEach(m => m.quantity = new Decimal(1E20))
        // this.honor.quantity = new Decimal(1E20)
    }
    // endregion

    // region stuff
    initResouces() {
        this.food = new Unit("food", "Food", "Food is used to ", this)
        this.wood = new Unit("wood", "Wood", "Wood is used to make buldings.", this)
        this.stone = new Unit("stone", "Stone", "Stone is used to make better buldings.", this)
        this.metal = new Unit("metal", "Metal", "Metal usually is used to make weapons.", this)
        this.gold = new Unit("gold", "Gold", "Gold is the main cuerrency.", this)
        this.science = new Unit("science", "Science", "Science is used to discover new things.", this)
        this.mana = new Unit("mana", "Mana", "Mana is used to cast spells.", this)

        this.matList = new TypeList("Materials")
        this.matList.list.push(this.food, this.wood, this.stone, this.metal, this.science, this.mana, this.gold)
        this.mainLists.push(this.matList)
    }
    initWorkers() {
        //    Templar
        this.templar = new Unit("soldier", "Templar", "Templar are veteran soldiers.", this)
        this.templar.productionIndep = true
        this.templar.createBuy([new Cost(this.food, new Decimal(1E3)), new Cost(this.gold, new Decimal(500))])
        this.templar.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.templar.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        //    Soldier
        this.soldier = new Unit("soldier", "Soldier", "Soldiers are the main unit of your army.", this)
        this.soldier.productionIndep = true
        this.soldier.createBuy([new Cost(this.food, new Decimal(100))])
        this.soldier.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.soldier.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])

        this.malusLists.forEach(l => l.forEach(m => {
            this.productionTable.push(new Production(this.soldier, m, new Decimal(-1), this))
            this.productionTable.push(new Production(this.templar, m, new Decimal(-10), this))
        }))

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
        this.mageTower.createBuy([new Cost(this.gold, new Decimal(1E3)), new Cost(this.stone, new Decimal(2E3))])
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
        this.woodCamp.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.metal, new Decimal(1E3))])
        this.woodCamp.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        this.woodCamp.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])

        //    University
        this.university = new Unit("university", "University", "University description", this)
        this.productionTable.push(new Production(this.university, this.student, new Decimal(1), this))
        this.productionTable.push(new Production(this.university, this.gold, new Decimal(-4), this))
        this.university.createBuy([new Cost(this.gold, new Decimal(1E3)), new Cost(this.stone, new Decimal(1E3))])
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
        const templarRes = new Research("orderRes", "Templars", "Templars kill malus",
            [new Cost(this.science, new Decimal(10))], [this.templar], this)
        const soldierRes = new Research("orderRes", "Soldiers", "Soldiers kill malus",
            [new Cost(this.science, new Decimal(10))], [templarRes, this.soldier], this)
        // endregion

        // region Workers
        this.orderRes = new Research("orderRes", "Orders", "Complete order to gain honor",
            [new Cost(this.science, new Decimal(1500))], [], this)
        this.initOver()
        this.orderRes.toUnlock.push(this.honor, this.ordTab, this.vilTab, this.travelTab, this.mainBuldingRes)
        this.mainBuldingRes.toUnlock.push(calthRes)

        const blackRes = new Research("blackRes", "Blacksmitting", "Unlock gold and blacksmiths",
            [new Cost(this.science, new Decimal(800))], [this.blacksmith, this.gold, this.orderRes], this)

        const manaRes = new Research("manaRes", "Mana", "Unlock mana, mages and spells",
            [new Cost(this.science, new Decimal(400))], [this.mage, this.mana, blackRes, bigHunt, this.spellTab], this)

        const metalRes = new Research("meRe", "Metal", "Unlocks metal and miners",
            [new Cost(this.science, new Decimal(200))], [this.miner, this.metal, manaRes], this)

        const stoneRes = new Research("stoRe", "Quarry", "Unlocks stone and Quarrymens",
            [new Cost(this.science, new Decimal(100))], [this.quarrymen, this.stone, metalRes, betterHunting], this)

        this.woodRes = new Research("woRe", "Woodcutting", "Unlocks wood and Lumberjacks",
            [new Cost(this.science, new Decimal(50))], [this.lumberjack, this.wood, stoneRes], this)
        // endregion
    }
    initMalus() {
        this.subInitMalus("Z", this.food, "Zombies", "Zombie", "Zombie description",
            "Lord Zombie", "Lord Zombie descriptio", "Lich Zombie", "Lich Zombie descriptio")

        this.subInitMalus("P", this.wood, "Pyromancers", "Pyromancer", "Pyromancer addept",
            "Pyromancer", "Lord Zombie descriptio", "Master Pyromancer", "Lich Zombie descriptio")

        this.subInitMalus("T", this.stone, "Gargoyles", "Small Gargoyle", "Zombie description",
            "Demon", "Lord Zombie descriptio", "Evil Demon", "Lich Zombie descriptio")

        this.subInitMalus("G", this.metal, "Golem", "Golem", "Zombie description",
            "Titan", "Lord Zombie descriptio", "Colossus", "Lich Zombie descriptio")

        this.subInitMalus("T", this.gold, "Thieves", "Thief", "Zombie description",
            "Expert Thief", "Lord Zombie descriptio", "Thief Guild", "Lich Zombie descriptio")

        this.subInitMalus("S", this.science, "Pseudoscientists", "Village Idiot", "Zombie description",
            "Pseudoscientist Student", "Lord Zombie descriptio", "Pseudoscientist", "Lich Zombie descriptio")

        this.subInitMalus("E", this.mana, "Heretics", "Witch", "Zombie description",
            "False Prophet", "Lord Zombie descriptio", "False God", "Lich Zombie descriptio")
    }
    subInitMalus(id: string, mat: Unit, typeName: string,
        name1: string, descr1: string, name2: string, descr2: string, name3: string, descr3: string) {
        const m1 = new Unit(id + "%1", name1, descr1, this)
        const m2 = new Unit(id + "%2", name2, descr2, this)
        const m3 = new Unit(id + "%3", name3, descr3, this)
        this.productionTable.push(new Production(m1, mat, new Decimal(-1), this))
        this.productionTable.push(new Production(m2, m1, new Decimal(0.01), this))
        this.productionTable.push(new Production(m3, m2, new Decimal(0.01), this))

        m1.alwaysOn = true
        m1.malus = true
        m1.productionIndep = true
        m2.alwaysOn = true
        m2.malus = true
        m2.productionIndep = true
        m3.alwaysOn = true
        m3.malus = true
        m3.productionIndep = true

        const list = new TypeList(typeName)
        list.list = [m1, m2, m3]
        this.malusLists.push(list.list)
        this.mainLists.push(list)
    }
    initPrestige() {
        this.teamPrestige = new Prestige("teP", "Team Bonus", "+20% team bonus", this)
        this.hirePrestige = new Prestige("hiP", "Retroactive Hire", "+5% team bonus", this)
        this.hirePrestige.limit = new Decimal(20)
        this.prestigeGrups.push(new PrestigeGroupModel("bon", "Bonus", "Bonus desc", [this.teamPrestige, this.hirePrestige]))

        this.spellPrestigePower = new Prestige("stP", "Spell Power", "+20% spell power", this)
        this.spellPrestigeTime = new Prestige("spP", "Spell Duration", "+20% spell duration", this)
        this.prestigeGrups.push(new PrestigeGroupModel("spell", "Spell", "Spell", [this.spellPrestigePower, this.spellPrestigeTime]))

        this.betterWorlds = new Prestige("btwol", "Better Village", "+20% village gain multiplier (only in new generated worlds)", this)
        this.prestigeGrups.push(new PrestigeGroupModel("village", "Village", "Village", [this.betterWorlds]))

        this.workList.list.forEach(w => {
            const follower = new Prestige(w.id + "9F", w.name + " follower",
                "5 " + w.name + " on new villages", this)
            this.follower.push(follower)
        })
        this.prestigeGrups.push(new PrestigeGroupModel("follower", "Follower", "Follower", this.follower))

        this.matList.list.forEach(w => {
            const g = new Prestige(w.id + "2y", w.name + " Multiplier",
                "+5% " + w.name + " earnings", this)
            this.gain.push(g)
            const bon = new Bonus(w.id + "PR", "Prestige Multi", "Prestige Multiplier",
                this, new Decimal(0.05), g, true)
            bon.unlocked = true
            bon.prestige = true
            w.bonus.push(bon)
        })
        this.prestigeGrups.push(new PrestigeGroupModel("multiplier", "Gain Multiplier", "Gain Multiplier", this.gain))

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

        this.monk = new Unit("Monk", "Monk", "Ora et labora", this)
        this.productionTable.push(new Production(this.monk, this.food, new Decimal(1), this))
        this.productionTable.push(new Production(this.monk, this.mana, new Decimal(1), this))
        this.monk.createBuy([new Cost(this.food, new Decimal(50))])
        this.monk.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.monk.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        golemList.list.push(this.monk)

    }
    initDwarf() {
        const dwarfList = new TypeList("Dwarfs"); this.mainLists.push(dwarfList)
        const dwarfList2 = new TypeList("Dwarfs Buildings"); this.mainLists.push(dwarfList2)
        const dwarfList3 = new TypeList("Dwarfs Masters"); this.mainLists.push(dwarfList3)
        const dwarfList4 = new TypeList("Dwarfs Guild"); this.mainLists.push(dwarfList4)
        const dwarfList5 = new TypeList("Dwarfs Company"); this.mainLists.push(dwarfList5)

        // region worker
        this.dwarfMiner = new Unit("dwMi", "Miner", "Dwarf Miner", this)
        this.productionTable.push(new Production(this.dwarfMiner, this.metal, new Decimal(1), this))
        this.dwarfMiner.createBuy([new Cost(this.food, new Decimal(20))])
        this.dwarfMiner.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.dwarfMiner.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(this.dwarfMiner)

        const engineer = new Unit("dwEn", "Engineer", "Dwarf Engineer", this)
        this.productionTable.push(new Production(engineer, this.science, new Decimal(1), this))
        this.productionTable.push(new Production(engineer, this.metal, new Decimal(-3), this))
        engineer.createBuy([new Cost(this.food, new Decimal(25))])
        engineer.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        engineer.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(engineer)

        const bartender = new Unit("dwba", "Bartender", "Dwarf Bartender", this)
        this.productionTable.push(new Production(bartender, this.gold, new Decimal(1), this))
        this.productionTable.push(new Production(bartender, this.food, new Decimal(-5), this))
        bartender.createBuy([new Cost(this.food, new Decimal(30))])
        bartender.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        bartender.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        dwarfList.list.push(bartender)

        const brewer = new Unit("dwBr", "Brewer", "Dwarf Brewer", this)
        this.productionTable.push(new Production(brewer, this.food, new Decimal(1), this))
        this.productionTable.push(new Production(brewer, this.wood, new Decimal(-2), this))
        brewer.createBuy([new Cost(this.food, new Decimal(35))])
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

        this.dwarfRes = new Research("dWarfR", "Dwarfs", "Dwarfs",
            [new Cost(this.science, new Decimal(100))], [], this)
        const dRes = this.createOver([dwarfList, dwarfList2, dwarfList3, dwarfList4, dwarfList5], "<", "Dwarf", this.dwarfRes)
        this.dwarfRes.toUnlock.push(dRes)

        const l = dwarfList.list.length
        for (let i = 1; i < l; i++) {
            const d = dwarfList.list[i]
            this.dwarfRes.toUnlock.push(new Research(i + "dwR1*", d.name, d.description,
                [new Cost(this.science, new Decimal(100 + 50 * i))], [d], this))
        }

        const dwarfBon = new Bonus("dwBon", "Mining",
            "x10 metal per Dwarf Mine; 20 sec",
            this, new Decimal(10), dwarfMiner2, false, "x10 metal x Dwarf Mine")
        dwarfBon.createActiveAct(new Decimal(1), new Decimal(100))
        const dwarfBonRes = new Research("dwBRes", dwarfBon.name, dwarfBon.description,
            [new Cost(this.science, new Decimal(1E4))], [dwarfBon], this)
        this.metal.bonus.push(dwarfBon)
        dRes.toUnlock.push(dwarfBonRes)

    }
    initResBonus() {
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
    }
    initElves() {
        const elfList = new TypeList("Elves"); this.mainLists.push(elfList)
        const elfList2 = new TypeList("Elves Buildings"); this.mainLists.push(elfList2)
        const elfList3 = new TypeList("Elves Masters"); this.mainLists.push(elfList3)
        const elfList4 = new TypeList("Elves Guild"); this.mainLists.push(elfList4)
        const elfList5 = new TypeList("Elves Company"); this.mainLists.push(elfList5)

        // region worker
        this.woodElf = new Unit("efl1", "Wood Elf", "Wood Elf", this)
        this.productionTable.push(new Production(this.woodElf, this.wood, new Decimal(1), this))
        this.woodElf.createBuy([new Cost(this.food, new Decimal(20))])
        this.woodElf.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        this.woodElf.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        elfList.list.push(this.woodElf)

        const elf2 = new Unit("efl2", "Elf Hunter", "Elf Hunter", this)
        this.productionTable.push(new Production(elf2, this.food, new Decimal(3), this))
        this.productionTable.push(new Production(elf2, this.wood, new Decimal(-1), this))
        elf2.createBuy([new Cost(this.food, new Decimal(25)), new Cost(this.wood, new Decimal(15))])
        elf2.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        elf2.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        elfList.list.push(elf2)

        const elf3 = new Unit("elf3", "High Elf", "High Elf", this)
        this.productionTable.push(new Production(elf3, this.mana, new Decimal(1), this))
        this.productionTable.push(new Production(elf3, this.food, new Decimal(-5), this))
        elf3.createBuy([new Cost(this.food, new Decimal(40))])
        elf3.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        elf3.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        elfList.list.push(elf3)

        const elf4 = new Unit("elf4", "Elf Scientist", "Elf Scientist", this)
        this.productionTable.push(new Production(elf4, this.science, new Decimal(1), this))
        this.productionTable.push(new Production(elf4, this.mana, new Decimal(-5), this))
        elf4.createBuy([new Cost(this.food, new Decimal(50)), new Cost(this.mana, new Decimal(15))])
        elf4.createBoost([new Cost(this.science, this.scienceCost1, this.expTeam)])
        elf4.createHire([new Cost(this.science, this.scienceCost1, this.expHire)])
        elfList.list.push(elf4)
        // endregion
        // region Buldings
        const elfB1 = new Unit("eflB1", "Elf Tree", "Elf Tree", this)
        this.productionTable.push(new Production(elfB1, this.woodElf, new Decimal(1), this))
        this.productionTable.push(new Production(elfB1, this.wood, new Decimal(-4), this))
        elfB1.createBuy([new Cost(this.wood, new Decimal(3E3))])
        elfB1.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        elfB1.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        elfList2.list.push(elfB1)

        const elfB2 = new Unit("elfB2", "Elf Camp", "Elf Camp", this)
        this.productionTable.push(new Production(elfB2, elf2, new Decimal(3), this))
        this.productionTable.push(new Production(elfB2, this.wood, new Decimal(-4), this))
        elfB2.createBuy([new Cost(this.wood, new Decimal(2E3)), new Cost(this.metal, new Decimal(500))])
        elfB2.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        elfB2.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        elfList2.list.push(elfB2)

        const elfB3 = new Unit("elfB3", "Elf Council", "Elf Council", this)
        this.productionTable.push(new Production(elfB3, elf3, new Decimal(1), this))
        this.productionTable.push(new Production(elfB3, this.mana, new Decimal(-5), this))
        elfB3.createBuy([new Cost(this.wood, new Decimal(1E3)), new Cost(this.gold, new Decimal(500))])
        elfB3.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        elfB3.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        elfList2.list.push(elfB3)

        const elfB4 = new Unit("elfB4", "Elf School", "Elf School", this)
        this.productionTable.push(new Production(elfB4, elf4, new Decimal(1), this))
        this.productionTable.push(new Production(elfB4, this.science, new Decimal(-5), this))
        elfB4.createBuy([new Cost(this.wood, new Decimal(3E3)), new Cost(this.stone, new Decimal(500))])
        elfB4.createBoost([new Cost(this.science, this.scienceCost2, this.expTeam)])
        elfB4.createHire([new Cost(this.science, this.scienceCost2, this.expHire)])
        elfList2.list.push(elfB4)
        // endregion
        this.elvesRes = new Research("ElvesR", "Elves", "Elves",
            [new Cost(this.science, new Decimal(100))], [], this)
        const dRes = this.createOver([elfList, elfList2, elfList3, elfList4, elfList5], ">", "Elves", this.dwarfRes)
        this.elvesRes.toUnlock.push(dRes)

        const l = elfList.list.length
        for (let i = 1; i < l; i++) {
            const d = elfList.list[i]
            this.elvesRes.toUnlock.push(new Research(i + "eR]", d.name, d.description,
                [new Cost(this.science, new Decimal(100 + 50 * i))], [d], this))
        }

        const elvenBon = new Bonus("elB@", "Elven Wood",
            "x10 wood per Elf Tree; 20 sec",
            this, new Decimal(10), elfB1, false, "wood per Elf Tree")
        elvenBon.createActiveAct(new Decimal(1), new Decimal(100))
        const elvenBonRes = new Research("elBReà", elvenBon.name, elvenBon.description,
            [new Cost(this.science, new Decimal(1E4))], [elvenBon], this)
        this.wood.bonus.push(elvenBon)
        dRes.toUnlock.push(elvenBonRes)

    }
    // endregion

    createOver(lists: TypeList[], id: string, name: string, first: Research) {
        const mainCompanyRes = new Research(id + "aCoR", name + " Company", name + " Company",
            [new Cost(this.science, new Decimal(1E16))],
            [], this)
        const mainGuildRes = new Research(id + "aGuR", name + " Guilds", name + " Guilds",
            [new Cost(this.science, new Decimal(1E10))],
            [mainCompanyRes], this)
        const mainMasterRes = new Research(id + "aMaR", name + " Master", name + " Master",
            [new Cost(this.science, new Decimal(1E6))],
            [mainGuildRes], this)
        const mainBuldingRes = new Research(id + "aBuR", name + " Buildings", name + " Buildings",
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
                worker.name + " Guild" + " makes " + master.name, this)
            const company = new Unit(worker.id + "-C",
                worker.name + " C.",
                worker.name + " Company" + " makes " + guild.name, this)

            this.productionTable.push(new Production(master, building, new Decimal(1), this))
            this.productionTable.push(new Production(guild, master, new Decimal(1), this))
            this.productionTable.push(new Production(company, guild, new Decimal(1), this))

            master.createBuy([new Cost(building, new Decimal(50))])
            guild.createBuy([new Cost(master, new Decimal(50)), new Cost(this.gold, new Decimal(1E6))])
            company.createBuy([new Cost(guild, new Decimal(50)), new Cost(this.gold, new Decimal(1E9))])

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

            const buildRes = new Research(worker.id + "^1", building.name, "Unlock " + building.name,
                [new Cost(this.science, new Decimal(5E3))], [building], this)
            const masterRes = new Research(worker.id + "^2", master.name, "Unlock " + master.name,
                [new Cost(this.science, new Decimal(1E7))], [master], this)
            const guildRes = new Research(worker.id + "^3", guild.name, "Unlock " + guild.name,
                [new Cost(this.science, new Decimal(1E11))], [guild], this)
            const compRes = new Research(worker.id + "^4", company.name, "Unlock " + company.name,
                [new Cost(this.science, new Decimal(1E16))], [company], this)

            mainBuldingRes.toUnlock.push(buildRes)
            mainMasterRes.toUnlock.push(masterRes)
            mainGuildRes.toUnlock.push(guildRes)
            mainCompanyRes.toUnlock.push(compRes)
        }
        const prices = [new Decimal(5E3), new Decimal(5E4), new Decimal(5E8), new Decimal(5E12), new Decimal(5E16)]
        const names = ["Workers", "Buildings", "Masters", "Guilds", "Companies"]
        for (let i = 0; i < 5; i++) {
            const research = res[i]
            const list = lists[i]
            const n = name + names[i] + " Bonus"
            const allBonRes = new Research(id + "ù" + i, n, n,
                [new Cost(this.science, prices[i].div(2))], [], this)
            research.toUnlock.push(allBonRes)
            list.list.forEach(work => {
                const bon = new Bonus("ò" + work.id, "Better " + work.name,
                    "+100% resources from " + work.name, this, new Decimal(1), null, true)
                const bonRes = new Research("@" + work.id, bon.name, bon.description,
                    [new Cost(this.science, prices[i], new Decimal(2))], [bon], this, new Decimal(3))
                bon.unitMulti = bonRes
                work.producs[0].bonus.push(bon)
                allBonRes.toUnlock.push(bonRes)
            })
        }
        return mainBuldingRes
    }

}

