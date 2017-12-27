import { Component, OnInit, HostBinding, Input } from '@angular/core';
import { Action } from 'app/model/action';
import { Cost } from 'app/model/cost';
import * as numberformat from 'swarm-numberformat';
import { ServService } from 'app/serv.service';
import { Decimal } from 'decimal.js';
import { Bonus } from '../model/bonus';

@Component({
    selector: 'app-action',
    templateUrl: './action.component.html',
    styleUrls: ['./action.component.scss']
})
export class ActionComponent implements OnInit {
    @HostBinding('class.card') card = 'card';

    @Input() action: Action
    required = 1
    numberformat = numberformat
    Math = Math

    constructor(public gameService: ServService) {
    }

    ngOnInit() {
       this.action.reloadMaxBuy()
       this.action.reloadStrings()
    }

    getReqNum(): Decimal {
        if (!this.gameService.game.buyMulti || this.gameService.game.buyMulti < 1) {
            return new Decimal(1)
        }

        return new Decimal(Math.max(Math.min(this.gameService.game.buyMulti, this.action.maxBuy.toNumber()), 1))
    }

    getPriceId(index, cost: Cost) {
        return cost.what.id
    }
}
