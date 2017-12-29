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

    constructor() {
        this.game = new Game()
        setInterval(this.update.bind(this), 250)    // 250
    }

    update() {
        this.game.update()
    }

    save() {
        try {
            if (typeof (Storage) !== 'undefined') {
                const data = this.game.getSave()
                const raw = LZString.compressToBase64(JSON.stringify(data))
                localStorage.setItem('save', raw)
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
                if (saveRaw) {
                    const dec = LZString.decompressFromBase64(saveRaw)
                    const save = JSON.parse(dec)
                    this.game.load(save)
                    this.msgs.push({ severity: 'success', summary: 'Game loaded', detail: "" })
                } else {
                    this.msgs.push({ severity: 'error', summary: 'Load error:',
                    detail: "Nothing to load" })
                }
            }
        } catch (ex) {
            this.msgs.push({ severity: 'error', summary: 'Load error:', detail: ex && ex.message ? ex.message : "unknow error" })
        }
    }

}
