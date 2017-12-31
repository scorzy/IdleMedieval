import { Options } from './model/options';
import { Injectable } from '@angular/core';
import { Game } from './model/game';
import * as LZString from 'lz-string';
import { ClarityIcons } from '@clr/icons';
import { Message } from 'primeng/components/common/api';
import { GrowlModule } from 'primeng/primeng';
import { ToastsManager } from 'ng2-toastr';

@Injectable()
export class ServService {

    game: Game
    options = new Options()

    constructor(public toastr: ToastsManager
    ) {
        this.game = new Game(this.options)
        this.load()
        setInterval(this.update.bind(this), 249)    // 250
        setInterval(this.save.bind(this), 60000)

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

}
