import { Decimal } from "decimal.js"

export class Base {

    quantity = new Decimal(0)
    unlocked = false
    avabileThisWorld = true
    alwaysOn = false
    isNew = false

    constructor(
        public id: string,
        public name = "",
        public description = ""
    ) { }

    getData() {
        const data: any = {}
        data.i = this.id
        data.q = this.quantity
        data.u = this.unlocked
        data.z = this.avabileThisWorld
        data.n = this.isNew
        return data
    }
    load(data: any) {
        if (data.q)
            this.quantity = new Decimal(data.q)
        if (data.u)
            this.unlocked = data.u
        if (data.z)
            this.avabileThisWorld = data.z
        if (data.n)
            this.isNew = data.n
    }
}
