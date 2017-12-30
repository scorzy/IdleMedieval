import { ServService } from './../serv.service';
import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
    selector: 'app-save',
    templateUrl: './save.component.html',
    styleUrls: ['./save.component.scss']
})
export class SaveComponent implements OnInit {
    @HostBinding('class.content-area') className = 'content-area'

    stringSave = ""
    open = false

    constructor(public service: ServService) { }

    ngOnInit() {
    }

    save(event: Event) { this.service.save(false) }
    load(event: Event) { this.service.load() }
    clear(event: Event) { this.service.clear() }

    export(event: Event) {
        this.stringSave = this.service.export()
    }

    import(event: Event) {
        this.service.import(this.stringSave.trim())
    }

}
