import { Component, OnInit, HostBinding, Input } from '@angular/core';
import { Bonus } from 'app/model/bonus';
import { Cost } from 'app/model/cost';
import * as numberformat from 'swarm-numberformat';

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
    constructor() { }

    ngOnInit() {
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

}
