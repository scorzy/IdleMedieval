import { ServService } from 'app/serv.service';
import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core';
import { Research } from 'app/model/action';
declare let preventScroll

@Component({
    selector: 'app-lab',
    templateUrl: './lab.component.html',
    styleUrls: ['./lab.component.scss']
})
export class LabComponent implements OnInit, OnDestroy {
    @HostBinding('class.content-container') className = 'content-container'
    resDone = false
    resList: Array<Research>
    constructor(
        public gameService: ServService
    ) { }

    ngOnInit() {
        this.gameService.game.isLab = true
        this.onChange()
        preventScroll()
    }

    ngOnDestroy() {
        this.gameService.game.isLab = false
    }

    getRestId(index, res: Research) {
        return res.getId()
    }

    onChange() {
        if (this.resDone)
            this.resList = this.gameService.game.resList.filter(r => r.owned)
        else
            this.resList = this.gameService.game.resList.filter(r => !r.owned)
    }
}
