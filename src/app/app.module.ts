import { ServService } from 'app/serv.service';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ClarityModule } from '@clr/angular';
import { AppComponent } from './app.component';
import { ROUTING } from "./app.routing";
import { HomeComponent } from "./home/home.component";
import { AboutComponent } from "./about/about.component";
import { FormatPipe } from './format.pipe';
import { UnitComponent } from './unit/unit.component';
import { SliderModule } from 'primeng/components/slider/slider';
import { ActionComponent } from './action/action.component';
import { LabComponent } from './lab/lab.component';
import { SaveComponent } from './save/save.component';
import { SpellListComponent } from './spell-list/spell-list.component';
import { SpellComponent } from './spell/spell.component';
import { VillageComponent } from './village/village.component';

@NgModule({
    declarations: [
        AppComponent,
        AboutComponent,
        HomeComponent,
        FormatPipe,
        UnitComponent,
        ActionComponent,
        LabComponent,
        SaveComponent,
        SpellListComponent,
        SpellComponent,
        VillageComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        ClarityModule,
        ROUTING,
        SliderModule
    ],
    providers: [ServService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
