import { Options } from './model/options';
import { Injectable } from '@angular/core';
import { Game } from './model/game';
import * as LZString from 'lz-string';
import { ClarityIcons } from '@clr/icons';
import { Message } from 'primeng/components/common/api';
import { GrowlModule } from 'primeng/primeng';
import { ToastsManager } from 'ng2-toastr';
import * as Decimal from 'break_infinity.js'

declare let kongregateAPI

@Injectable()
export class ServService {

    game: Game
    options = new Options()
    kongregate: any
    isKongregate = false
    sub: any

    constructor(public toastr: ToastsManager
    ) {
        this.game = new Game(this.options)
        this.load()
        setInterval(this.update.bind(this), 250)    // 250
        setInterval(this.save.bind(this), 60000)

        if (typeof kongregateAPI !== 'undefined') {
            kongregateAPI.loadAPI(() => {

                this.kongregate = kongregateAPI.getAPI();
                console.log("KongregateAPI Loaded");
                this.setSize()
                //  this.kongregate.services.resizeGame(1920, 1080)
                setTimeout(() => {
                    try {
                        console.log("Kongregate build")
                        
                        this.sendKong()
                        this.isKongregate = true
                        this.sub = this.game.travelEmitter.subscribe(a => this.sendKong())
                    } catch (e) {
                        console.log("Error: " + e.message)
                    }
                }, 1 * 1000)

            })
        } else
            console.log("Github build")
    }

    update() {
        this.game.update()
    }

    export(): string {
        const data = this.game.getSave()
        data.opti = this.options
        return LZString.compressToBase64(JSON.stringify(data))
    }
    import(saveRaw: string) {
        if (saveRaw) {
            const dec = LZString.decompressFromBase64(saveRaw)
            const save = JSON.parse(dec)
            this.game.load(save)
            if (save.opti) {
                this.options.load(save.opti)
                this.options.apply()
            }
            this.toastr.success("", "Game Loaded")
        } else {
            this.toastr.error("No savegame found", "Error")
        }
    }

    save(timer = true) {
        try {
            if (typeof (Storage) !== 'undefined') {
                const raw = this.export()
                localStorage.setItem('save', raw)
                if (!timer || (timer && !this.options.hsn))
                    this.toastr.success("", 'Game Saved')
            } else {
                this.toastr.warning("Canot access local storage", "Not saved")
            }
        } catch (ex) {
            this.toastr.error(ex && ex.message ? ex.message : "unknow error", "Saving Error")
        }
    }
    load() {
        try {
            if (typeof (Storage) !== 'undefined') {
                const saveRaw = localStorage.getItem('save')
                this.import(saveRaw)
            } else {
                this.toastr.warning("Cannot access localstorage", "Not Loaded")
            }
        } catch (ex) {
            this.toastr.error(ex && ex.message ? ex.message : "unknow error", "Load Error")
        }
    }
    clear() {
        this.game = null
        localStorage.clear()
        this.game = new Game(this.options)
        window.location.reload()
    }

    nonInfinite(num: Decimal): number {
        const level = num.toNumber()
        return level < Number.POSITIVE_INFINITY && level < 137438953470 ? level : 0
    }

    sendKong() {
        try {
            this.kongregate.stats.submit('Honor', this.nonInfinite(this.game.lifePrestige))
            console.log("Prestige sent: " + this.nonInfinite(this.game.lifePrestige))
        } catch (e) {
            console.log("Error: " + e.message)
        }

    }
    setSize() {
        if (this.options.width > 1050 && this.options.height > 700) {
            console.log("Window Size: " + this.options.width + " " + this.options.height)
            this.kongregate.services.resizeGame(this.options.width, this.options.height)
        }
    }

}
