import { Component, HostBinding } from '@angular/core';

@Component({
    styleUrls: ['./about.component.scss'],
    templateUrl: './about.component.html'
})
export class AboutComponent {
    @HostBinding('class.content-area') className = 'content-area'

}
