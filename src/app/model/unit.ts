import { Production } from './production';
import { Base } from './base'
import { Action, Buy } from './action';
import { Cost } from './cost';
import { Decimal } from 'decimal.js';

export class Unit extends Base {

    actions = new Array<Action>()
    percentage = 100
    producs = new Array<Production>()
    madeBy = new Array<Production>()
    buyAction: Buy

    producsActive = new Array<Production>()

    showUp = false
    totalPerSec = new Decimal(0)
    totalProducers = new Decimal(0)
    realtotalPerSec = new Decimal(0)
    notEnought = false

    boost = new Decimal(1)

    constructor(
        id: string,
        name: string,
        description: string
    ) {
        super(id, name, description)
    }

    getData(): any {
        const data = super.getData()
        data.a = this.actions.map(act => act.getData())
        return data
    }
    load(data: any) {
        super.load(data)
        if (data.a) {
            data.a.forEach(element => {
                const action = this.actions.find(act => act.id = element.id)
                if (action) {
                    action.load(element)
                }
            })
        }
    }
    isStopped() { return this.percentage < Number.EPSILON }
    reloadProd() { this.producs.forEach(p => p.reload()) }
    reloadBoost() {

    }

}
