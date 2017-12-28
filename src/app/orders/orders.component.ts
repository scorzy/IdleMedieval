import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Component, OnInit, HostBinding } from '@angular/core';
import { ServService } from 'app/serv.service';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {

    @HostBinding('class.content-container') className = 'content-container'

    constructor(public gameServer: ServService) { }

    ngOnInit() {
        this.gameServer.game.isOrd = true
        this.gameServer.game.village.kingOrders.forEach(o => {
            o.reloadMaxBuy()
            o.reloadStrings()
        })
    }
    ngOnDestroy(): void {
        this.gameServer.game.isOrd = false
    }

}
