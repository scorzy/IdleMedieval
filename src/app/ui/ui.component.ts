import { ServService } from 'app/serv.service';
import { Component, OnInit } from '@angular/core';
declare let setCss: any

@Component({
    selector: 'app-ui',
    templateUrl: './ui.component.html',
    styleUrls: ['./ui.component.scss']
})
export class UiComponent implements OnInit {

    constructor(public gameService: ServService) { }

    ngOnInit() {
    }
    setCss() {
        setCss(this.gameService.options.dark)
    }

}
