import { Base } from '../model/base';
import { Component, OnInit, HostBinding } from '@angular/core';
import { Unit } from 'app/model/unit';
import { ServService } from 'app/serv.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
declare let preventScroll

@Component({
    selector: 'app-unit',
    templateUrl: './unit.component.html',
    styleUrls: ['./unit.component.scss']
})
export class UnitComponent implements OnInit, OnDestroy {

    @HostBinding('class.content-area') className = 'content-area';
    mioId = "0";
    paramsSub: any;
    gen: Unit;

    constructor(public gameService: ServService,
        private route: ActivatedRoute,
        private activatedRoute: ActivatedRoute,
        private router: Router) {
        this.gen = this.gameService.game.food
    }

    ngOnInit() {
        this.paramsSub = this.activatedRoute.params.subscribe(params => {
            this.mioId = params['id'];
            if (this.mioId === undefined) {
                this.mioId = "food"
            }
            this.gen = this.gameService.game.activeUnits.find(u => u.id === this.mioId)
            if (!this.gen)
                this.gen = this.gameService.game.hunter
            this.gameService.game.activeUnit = this.gen
            this.gen.isNew = false
        });
        setTimeout(preventScroll, 0)
    }
    ngOnDestroy() {
        this.paramsSub.unsubscribe()
        this.gameService.game.activeUnit = null
    }
    getUnitId(index, base: Base) {
        return base.id
    }


}
