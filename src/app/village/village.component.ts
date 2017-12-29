import { Component, OnInit, HostBinding, Input, ChangeDetectionStrategy } from '@angular/core';
import * as numberformat from 'swarm-numberformat';
import * as Decimal from 'break_infinity.js'
import { Bonus } from '../model/bonus'
import { Village } from '../model/village'
import { ServService } from '../serv.service';

@Component({
    selector: 'app-village',
    templateUrl: './village.component.html',
    styleUrls: ['./village.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VillageComponent implements OnInit {
    @HostBinding('class.card') card = 'card'

    @Input() village: Village
    @Input() home = false

    constructor(public gs: ServService) {
        this.village = gs.game.village
    }

    ngOnInit() {
    }

}
