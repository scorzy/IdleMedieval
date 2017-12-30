import { ServService } from 'app/serv.service'
import { Component, OnInit, HostBinding } from '@angular/core'

@Component({
    selector: 'app-prestige-nav',
    templateUrl: './prestige-nav.component.html',
    styleUrls: ['./prestige-nav.component.scss']
})
export class PrestigeNavComponent implements OnInit {
    @HostBinding('class.content-container') className = 'content-container'

    constructor(public serv: ServService) { }

    ngOnInit() {
    }

}
