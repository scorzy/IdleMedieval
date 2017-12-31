import { ServService } from './../serv.service';
import { Component, OnInit, HostBinding, Input, PipeTransform } from '@angular/core';
import { Bonus } from 'app/model/bonus';
import { Cost } from 'app/model/cost';
import * as numberformat from 'swarm-numberformat';
import { FormatPipe } from 'app/format.pipe';

@Component({
    selector: 'app-spell',
    templateUrl: './spell.component.html',
    styleUrls: ['./spell.component.scss']
})
export class SpellComponent implements OnInit {
    // @HostBinding('class.card') card = 'card'
    // @HostBinding('class.clickable') clickable = 'clickable'

    @Input() bonus: Bonus
    numberformat = numberformat
    Math = Math
    desc = ""
    constructor(public s: ServService) { }

    ngOnInit() {
        const pipe = new FormatPipe(this.s)
        let time = this.bonus.activeAction.getTickAct().div(4).toNumber()
        const sec = time % 60
        time = time / 60
        const min = time % 60
        time = time / 60
        const hour = time
        this.desc = pipe.transform(this.bonus.activeAction.realPriceNow[0].basePrice) +
            " - x" + pipe.transform(this.bonus.power.plus(this.bonus.power.times(this.s.game.spellPrestigePower.quantity).times(0.2)))
            + " " + this.bonus.shortDesc + "; " +
            (hour > 1 ? hour + "h " : "") +
            (min > 1 ? min + "m " : "") +
            (sec > 1 ? sec + "s " : "")
    }

    activate() {
        this.bonus.activeAction.buy()
    }

    getPriceId(index, cost: Cost) {
        return cost.what.id
    }

    buy() {
        if (this.bonus.activeAction.canBuy)
            this.bonus.activeAction.buy()
    }

    getPercent(): number {
        return this.bonus.tickLeft.div(this.bonus.activeAction.getTickAct()).times(100).toNumber()
    }


}
