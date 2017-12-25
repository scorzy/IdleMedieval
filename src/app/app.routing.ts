import { ModuleWithProviders } from '@angular/core/src/metadata/ng_module'
import { Routes, RouterModule } from '@angular/router'

import { AboutComponent } from './about/about.component'
import { HomeComponent } from './home/home.component'
import { UnitComponent } from './unit/unit.component'
import { LabComponent } from 'app/lab/lab.component';

export const ROUTES: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
        path: 'home', component: HomeComponent,
        children: [
            { path: ':id', component: UnitComponent }
        ]
    },
    { path: 'lab', component: LabComponent },
    { path: 'about', component: AboutComponent }
];

export const ROUTING: ModuleWithProviders = RouterModule.forRoot(ROUTES, { useHash: true });
