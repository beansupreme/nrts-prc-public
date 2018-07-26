import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { RouterModule } from '@angular/router';

// modules
import { SharedModule } from 'app/shared.module';

// services
import { CustomCompileService } from 'app/services/customcompile.service';

// components
import { ApplicationsComponent } from './applications.component';
import { ApplistListComponent } from './applist-list/applist-list.component';
import { ApplistMapComponent } from './applist-map/applist-map.component';
import { ApplistFiltersComponent } from './applist-filters/applist-filters.component';
import { MarkerPopupComponent } from './marker-popup/marker-popup.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule.forRoot(),
    NgxPaginationModule,
    RouterModule,
    SharedModule
  ],
  declarations: [
    ApplicationsComponent,
    ApplistListComponent,
    ApplistMapComponent,
    ApplistFiltersComponent,
    MarkerPopupComponent
  ],
  providers: [
    CustomCompileService,
  ],
  entryComponents: [
    MarkerPopupComponent
  ]
})

export class ApplicationsModule { }
