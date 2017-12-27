import { ServService } from 'app/serv.service';
import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
    selector: 'app-spell-list',
    templateUrl: './spell-list.component.html',
    styleUrls: ['./spell-list.component.scss']
})
export class SpellListComponent implements OnInit {
    // @HostBinding('class.content-area') className = 'content-area'

    constructor(
        public gameService: ServService
    ) { }

    ngOnInit() {
    }

}
