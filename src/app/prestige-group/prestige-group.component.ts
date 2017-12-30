import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core'
import { ServService } from 'app/serv.service'
import { Action, Prestige } from 'app/model/action'
import { ActivatedRoute, Router } from '@angular/router'
import { PrestigeGroupModel } from 'app/model/prestigeGroupModel'

declare let preventScroll

@Component({
    selector: 'app-prestige-group',
    templateUrl: './prestige-group.component.html',
    styleUrls: ['./prestige-group.component.scss']
})
export class PrestigeGroupComponent implements OnInit, OnDestroy {
    @HostBinding('class.content-area') className = 'content-area';

    mioId = ""
    paramsSub: any
    group: PrestigeGroupModel

    constructor(public gameService: ServService,
        private route: ActivatedRoute,
        private activatedRoute: ActivatedRoute,
        private router: Router) {
        this.group = this.gameService.game.prestigeGrups[0]
    }

    ngOnInit() {
        this.paramsSub = this.activatedRoute.params.subscribe(params => {
            this.mioId = params['id']
            this.group = this.gameService.game.prestigeGrups.find(u => u.id === this.mioId)
            if (!this.group)
                this.group = this.gameService.game.prestigeGrups[0]
            this.group.actions.forEach(a => {
                a.reloadMaxBuy()
                a.reloadStrings()
            })
        })
        setTimeout(preventScroll, 0)
    }
    ngOnDestroy() {
        this.paramsSub.unsubscribe()
    }
    getId(index, p: Prestige) {
        return p.getId()
    }

}
