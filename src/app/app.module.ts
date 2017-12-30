import { ToastOptions } from 'ng2-toastr/ng2-toastr';
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
import { OrdersComponent } from './orders/orders.component';
import { CurVillComponent } from './cur-vill/cur-vill.component';
import { TravelComponent } from './travel/travel.component';
import { PrestigeNavComponent } from './prestige-nav/prestige-nav.component';
import { OptionsComponent } from './options/options.component';
import { UiComponent } from './ui/ui.component';
import { PrestigeGroupComponent } from './prestige-group/prestige-group.component';
import { SpellTabComponent } from './spell-tab/spell-tab.component';
import { ToastModule } from 'ng2-toastr/src/toast.module';

export class CustomOptions extends ToastOptions {
    animate = 'fade'
    dismiss = 'auto'
    showCloseButton = true
    newestOnTop = true
    enableHTML = true
    positionClass = 'toast-bottom-right'
}

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
        VillageComponent,
        OrdersComponent,
        CurVillComponent,
        TravelComponent,
        PrestigeNavComponent,
        OptionsComponent,
        UiComponent,
        PrestigeGroupComponent,
        SpellTabComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        ClarityModule,
        ROUTING,
        SliderModule,
        ToastModule.forRoot(),
    ],
    providers: [{ provide: ToastOptions, useClass: CustomOptions }, ServService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
