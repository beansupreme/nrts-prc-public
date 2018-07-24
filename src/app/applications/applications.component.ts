import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import * as L from 'leaflet';
import * as _ from 'lodash';

import { Application } from 'app/models/application';
import { ApplicationService } from 'app/services/application.service';
import { ConfigService } from 'app/services/config.service';
import { FiltersType } from 'app/applications/applist-filters/applist-filters.component';

// NB: page size is calculated to optimize Waiting vs Download time
// all 1414 at once => ~4.5 seconds
// 15 pages of 100 => ~25 seconds
// 6 pages of 250 => ~9 seconds
// 3 pages of 500 => ~3.5 seconds
const PAGE_SIZE = 500;

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})

export class ApplicationsComponent implements OnInit, OnDestroy {

  @ViewChild('appmap') appmap;
  @ViewChild('applist') applist;
  @ViewChild('appfilters') appfilters;

  public listPageSize = 10;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  public applications: Array<Application> = [];
  private filters: FiltersType = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    public snackBar: MatSnackBar,
    private router: Router,
    private applicationService: ApplicationService,
    public configService: ConfigService // used in template
  ) { }

  ngOnInit() {
    // prevent underlying map actions for list and filters components
    const applist_list = <HTMLElement>document.getElementById('applist-list');
    L.DomEvent.disableClickPropagation(applist_list);
    L.DomEvent.disableScrollPropagation(applist_list);

    const applist_filters = <HTMLElement>document.getElementById('applist-filters');
    L.DomEvent.disableClickPropagation(applist_filters);
    L.DomEvent.disableScrollPropagation(applist_filters);

    // get initial filters
    this.filters = { ...this.appfilters.getFilters() };

    // load initial apps for map
    this.getApps();
  }

  // retrieves all apps (without extended data)
  private getApps() {
    // do this in another event so it's not in current change detection cycle
    setTimeout(() => {
      this.snackBarRef = this.snackBar.open('Loading map ...');
      this.applications = []; // empty the list
      this._getPageOfApps(0, PAGE_SIZE);
    }, 0);
  }

  // NB: recursive function
  private _getPageOfApps(pageNum: number, pageSize: number) {
    this.applicationService.getAll(pageNum, pageSize, this.filters.regionFilters, this.filters.cpStatusFilters, this.filters.appStatusFilters,
      this.filters.applicantFilter, this.filters.clFileFilter, this.filters.dispIdFilter, this.filters.purposeFilter)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(apps => {
        this.applications = _.concat(this.applications, apps);
        // check if we need to load another page
        if (apps.length >= PAGE_SIZE) {
          this._getPageOfApps(++pageNum, PAGE_SIZE);
        } else {
          // NB: this snackbar will automatically dismiss the previous snackbar
          this.snackBarRef = this.snackBar.open('Map loaded !', null, { duration: 1000 });
          // now load initial apps for list
          this._getPageOfAppsExtended();
        }
      }, error => {
        console.log(error);
        alert('Uh-oh, couldn\'t load applications');
        // applications not found --> navigate back to home
        this.router.navigate(['/']);
      });
  }

  // retrieves (another) 'listPageSize' apps with extended data
  private _getPageOfAppsExtended() {
    let n = 0;
    // TODO: load as batch (instead of individually)
    for (let i = 0; i < this.applications.length; i++) {
      if (this.applications[i].isLoaded) { continue; }

      this.applicationService.getById(this.applications[i]._id)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => {
            // update this element in the main list
            this.applications[i] = application;
          },
          error => {
            console.log(error);
            this.snackBarRef = this.snackBar.open('Uh-oh, couldn\'t load application', null, { duration: 3000 });
          });

      if (++n >= this.configService.listPageSize) { break; }
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Event handler called when filters component updates list of matching apps.
   */
  public onUpdateMatching(filters: FiltersType) {
    this.filters = { ...filters };
    this.getApps();
  }

  /**
   * Event handler called when list component selects or unselects an app.
   */
  public onHighlightApplication(app: Application, show: boolean) { this.appmap.onHighlightApplication(app, show); }

  /**
   * Event handler called when Load More button is clicked.
   */
  public onLoadMore() { this._getPageOfAppsExtended(); }

  /**
   * Event handler called when List Page Size input has changed.
   */
  public onListPageSizeChange() { /* nothing for now */ }

  /**
   * Event handler called when Update Results checkbox has changed.
   */
  public onUpdateResultsChange() { this.appmap.setVisibleDebounced(); }

  /**
   * Event handler called when Draw Shapes checkbox has changed.
   */
  public onDrawShapesChange() { this.appmap.onDrawShapesChange(); }

  /**
   * Event handler called when Cluster Applications checkbox has changed.
   */
  public onClusterAppsChange() { this.appmap.onClusterAppsChange(); }

  /**
   * Called when list component visibility is toggled.
   */
  public toggleAppList() { this.appmap.toggleAppList(); }

}
