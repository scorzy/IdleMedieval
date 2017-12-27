import { Injectable } from '@angular/core';
import { Game } from './model/game';
import * as LZString from 'lz-string';
import { ClarityIcons } from '@clr/icons';

@Injectable()
export class ServService {

    game: Game
    constructor() {
        this.game = new Game()
        setInterval(this.update.bind(this), 250)
    }

    update() {
        this.game.update()
    }

    save() {
        // try {
            if (typeof (Storage) !== 'undefined') {
                const data = this.game.getSave()
                const raw = LZString.compressToBase64(JSON.stringify(data))
                localStorage.setItem('save', raw)
            } else {
                console.log("no local storage")
            }
        // } catch (ex) {
        //     console.log("save error: " + ex && ex.message ? ex.message : "unknow error")
        // }
    }
    load() {
        // try {
            if (typeof (Storage) !== 'undefined') {
                const saveRaw = localStorage.getItem('save')
                if (saveRaw) {
                    const dec = LZString.decompressFromBase64(saveRaw)
                    const save = JSON.parse(dec)
                    this.game.load(save)
                }
            }
        // } catch (ex) {
        //     console.log("load error: " + ex && ex.message ? ex.message : "unknow error")
        // }
    }

}
