import { ServService } from 'app/serv.service';
import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
    selector: 'app-travel',
    templateUrl: './travel.component.html',
    styleUrls: ['./travel.component.scss']
})
export class TravelComponent implements OnInit {
    @HostBinding('class.content-container') className = 'content-container'

    constructor(public ss: ServService) { }

    ngOnInit() {
        this.ss.game.setMaxLevel()
    }

    change() {
        this.ss.game.setRandomVillage()
    }

}
