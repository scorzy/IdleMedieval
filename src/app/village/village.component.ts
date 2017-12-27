import { Component, OnInit, HostBinding, Input } from '@angular/core';
import * as numberformat from 'swarm-numberformat';
import { Decimal } from 'decimal.js'
import { Bonus } from '../model/bonus'
import { Village } from '../model/village'
import { ServService } from '../serv.service';

@Component({
    selector: 'app-village',
    templateUrl: './village.component.html',
    styleUrls: ['./village.component.scss']
})
export class VillageComponent implements OnInit {
    @HostBinding('class.card') card = 'card'

    @Input() village: Village

    constructor(public gs: ServService) {
        this.village = gs.game.village
    }

    ngOnInit() {
    }

}
