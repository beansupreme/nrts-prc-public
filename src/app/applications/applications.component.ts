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

// page size is calculated to look OK on mid-tier mobile
// and not be too frantic on fast networks
const PAGE_SIZE = 200;

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})

export class ApplicationsComponent implements OnInit, OnDestroy {

  @ViewChild('appmap') appmap;
  @ViewChild('applist') applist;
  @ViewChild('appfilters') appfilters;

  private _loading = false;
  set isLoading(val: boolean) {
    this._loading = val;
    if (val) {
      this.appmap.onLoadStart();
      this.appfilters.onLoadStart();
    } else {
      this.appmap.onLoadEnd();
      this.appfilters.onLoadEnd();
    }
  }

  private _loadingExtended = false;
  set isLoadingExtended(val: boolean) {
    this._loadingExtended = val;
    if (val) {
      this.applist.onLoadMoreStart();
    } else {
      this.applist.onLoadMoreEnd();
    }
  }

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
    this._getApps();
  }

  // retrieves all apps (without extended data)
  private _getApps() {
    // do this in another event so it's not in current change detection cycle
    setTimeout(() => {
      this.isLoading = true;
      this.snackBarRef = this.snackBar.open('Loading map ...');
      if (this.applications.length > 0) { this.applications = []; } // empty the list (except first time)
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
          this.snackBarRef.dismiss();
          this.isLoading = false;
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
    let isStarted = false;
    let numToLoad = 0;
    let numRemaining = 0;

    for (let i = 0; i < this.applications.length; i++) {
      if (this.applications[i]) { // safety check
        if (!this.applications[i].isVisible) { continue; } // skip over hidden apps
        if (this.applications[i].isLoaded) { continue; } // skip over already-loaded apps
        if (numToLoad++ >= this.configService.listPageSize) { break; }

        if (!isStarted) {
          this.isLoadingExtended = true;
          isStarted = true;
        }

        numRemaining++;
        this.applicationService.getById(this.applications[i]._id)
          .takeUntil(this.ngUnsubscribe)
          .subscribe(
            application => {
              // update this element in the main list
              this.applications[i] = application;
              if (--numRemaining <= 0) {
                this.isLoadingExtended = false;
              }
            },
            error => {
              console.log(error);
              this.snackBarRef = this.snackBar.open('Uh-oh, couldn\'t load application', null, { duration: 3000 });
            });
      }
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
    if (!this.isLoading) { this._getApps(); } // safety check
  }

  /**
   * Event handler called when list component selects or unselects an app.
   */
  public onHighlightApplication(app: Application, show: boolean) { this.appmap.onHighlightApplication(app, show); }

  /**
   * Event handler called when Load More button is clicked.
   */
  public onLoadMore() {
    if (!this.isLoadingExtended) { this._getPageOfAppsExtended(); } // safety check
  }

  /**
   * Event handler called when map needs to reload list.
   */
  public onReloadList() {
    if (!this.isLoadingExtended) { this._getPageOfAppsExtended(); } // safety check
  }

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
