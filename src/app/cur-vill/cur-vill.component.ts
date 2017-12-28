import { Component, OnInit, HostBinding } from '@angular/core';
import { ServService } from 'app/serv.service';

@Component({
    selector: 'app-cur-vill',
    templateUrl: './cur-vill.component.html',
    styleUrls: ['./cur-vill.component.scss']
})
export class CurVillComponent implements OnInit {
    @HostBinding('class.content-container') className = 'content-container'

    constructor(public gameServ: ServService) { }

    ngOnInit() {
    }

}
