import { ServService } from './../serv.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-save',
    templateUrl: './save.component.html',
    styleUrls: ['./save.component.scss']
})
export class SaveComponent implements OnInit {

    constructor(public service: ServService) { }

    ngOnInit() {
    }

    save(event: Event) { this.service.save() }
    load(event: Event) { this.service.load() }

}
