import { Options } from './model/options';
import { Injectable } from '@angular/core';
import { Game } from './model/game';
import * as LZString from 'lz-string';
import { ClarityIcons } from '@clr/icons';
import { Message } from 'primeng/components/common/api';
import { GrowlModule } from 'primeng/primeng';

@Injectable()
export class ServService {

    game: Game
    msgs: Message[] = [];
    options = new Options()

    constructor() {
        this.game = new Game()
        setInterval(this.update.bind(this), 250)    // 250
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
            this.msgs.push({ severity: 'success', summary: 'Game loaded', detail: "" })
        } else {
            this.msgs.push({
                severity: 'error', summary: 'Load error:',
                detail: "Nothing to load"
            })
        }
    }

    save(timer = true) {
        try {
            if (typeof (Storage) !== 'undefined') {
                const raw = this.export()
                localStorage.setItem('save', raw)
                if (!timer || (timer && !this.options.hsn))
                    this.msgs.push({ severity: 'success', summary: 'Save done', detail: "" })
            } else {
                this.msgs.push({ severity: 'error', summary: 'Save error:', detail: "Cannot acces localstorage" })
            }
        } catch (ex) {
            this.msgs.push({ severity: 'error', summary: 'Save error:', detail: ex && ex.message ? ex.message : "unknow error" })
        }
    }
    load() {
        try {
            if (typeof (Storage) !== 'undefined') {
                const saveRaw = localStorage.getItem('save')
                this.import(saveRaw)
            }
        } catch (ex) {
            this.msgs.push({ severity: 'error', summary: 'Load error:', detail: ex && ex.message ? ex.message : "unknow error" })
        }
    }
    clear() {
        this.game = null
        localStorage.clear()
        this.game = new Game()
        window.location.reload()
    }

}
