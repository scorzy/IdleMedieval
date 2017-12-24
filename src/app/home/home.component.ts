import { Component, HostBinding } from "@angular/core";
import { ServService } from "app/serv.service";
import { TypeList } from "app/model/typeList";
import { Base } from "app/model/base";
import { Decimal } from 'decimal.js';

@Component({
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent {
    @HostBinding('class.content-container') className = 'content-container';

    constructor(public gameService: ServService) { }
    getListId(index, list: TypeList) {
        return list.getId()
    }
    getUnitId(index, base: Base) {
        return base.id
    }
}
