import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { NotfoundComponent } from './notfound/notfound.component';
import { HttpClientModule } from '@angular/common/http';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { QuerybuilderComponent } from './querybuilder/querybuilder.component';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextareaModule } from "primeng/inputtextarea";
import { InputTextModule } from "primeng/inputtext";
import { DatePipe } from '@angular/common';
import { ChipModule } from "primeng/chip";
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { TreeviewComponent } from './treeview/treeview.component';
import { TreeTableModule } from 'primeng/treetable';
import { BadgeModule } from 'primeng/badge';
import { EtwExplorerComponent } from './etw-explorer/etw-explorer.component';


@NgModule({
    declarations: [
        AppComponent, NotfoundComponent, QuerybuilderComponent, TreeviewComponent, EtwExplorerComponent
    ],
    imports: [
        AppRoutingModule,
        AppLayoutModule,
        HttpClientModule,
        ChartModule,
        TagModule,
        FormsModule,
        CodemirrorModule,
        TableModule,
        ButtonModule,
        RippleModule,
        InputTextareaModule,
        InputTextModule,
        ChipModule,
        DialogModule,
        TreeTableModule,
        CommonModule,
        BadgeModule
    ],
    providers: [
        DatePipe,
        { provide: LocationStrategy, useClass: HashLocationStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
