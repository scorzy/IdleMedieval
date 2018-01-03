declare let setCss: any

export class Options {

    header = 5
    dark = false
    usaFormat = false
    hsn = false
    spellSide = false
    noNew = false
    width = 0
    height = 0

    constructor(
    ) { }

    apply() {
        setCss(this.dark)
    }
    load(data: any) {
        if (data.header)
            this.header = data.header
        if (data.dark)
            this.dark = data.dark
        if (data.usaFormat)
            this.usaFormat = data.usaFormat
        if (data.hsn)
            this.hsn = data.hsn
        if (data.spellSide)
            this.spellSide = data.spellSide
        if (data.noNew)
            this.noNew = data.noNew
        if (data.width)
            this.width = data.width
        if (data.height)
            this.height = data.height
    }

}
