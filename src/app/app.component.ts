import { Component, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { ServService } from 'app/serv.service';
import { TypeList } from 'app/model/typeList';
import { ToastsManager } from 'ng2-toastr';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    percentPreset = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]

    constructor(private router: Router,
        public gameService: ServService,
        public toastr: ToastsManager,
        vcr: ViewContainerRef) {
        this.toastr.setRootViewContainerRef(vcr)
    }
    all100() {
        this.gameService.game.allUnit.forEach(u => u.percentage = 100)
    }
    getListId(index, list: TypeList) {
        return list.getId()
    }
    getClass() {
        return "header-" + this.gameService.options.header
    }
    noNew() {
        this.gameService.game.allUnit.forEach(u => u.isNew = false)
    }
}
