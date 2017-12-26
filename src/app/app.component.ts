import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServService } from 'app/serv.service';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(private router: Router,
        public gameService: ServService) {
    }
    getClass() {
        return "header-5"
    }
}
