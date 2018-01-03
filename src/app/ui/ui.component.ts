import { ServService } from 'app/serv.service';
import { Component, OnInit, HostBinding } from '@angular/core';
declare let setCss: any

@Component({
    selector: 'app-ui',
    templateUrl: './ui.component.html',
    styleUrls: ['./ui.component.scss']
})
export class UiComponent implements OnInit {
    @HostBinding('class.content-area') className = 'content-area'

    constructor(public gameService: ServService) { }

    ngOnInit() {
    }
    setCss() {
        setCss(this.gameService.options.dark)
    }
    setSize() {
        this.gameService.setSize()
    }

}
