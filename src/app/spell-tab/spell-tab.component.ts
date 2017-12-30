import { Component, OnInit, HostBinding } from '@angular/core'
import { ServService } from 'app/serv.service'

@Component({
    selector: 'app-spell-tab',
    templateUrl: './spell-tab.component.html',
    styleUrls: ['./spell-tab.component.scss']
})
export class SpellTabComponent implements OnInit {
    @HostBinding('class.content-container') className = 'content-container'

    constructor(public serv: ServService) { }

    ngOnInit() {
    }

}
