import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
    selector: 'app-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit {
    @HostBinding('class.content-container') className = 'content-container'

    constructor() { }

    ngOnInit() {
    }

}
