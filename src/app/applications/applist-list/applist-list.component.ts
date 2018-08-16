import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges, ElementRef } from '@angular/core';
import * as _ from 'lodash';

import { Application } from 'app/models/application';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { ConfigService } from 'app/services/config.service';

@Component({
  selector: 'app-applist-list',
  templateUrl: './applist-list.component.html',
  styleUrls: ['./applist-list.component.scss']
})

export class ApplistListComponent implements OnInit, OnChanges, OnDestroy {
  // NB: this component is bound to the same list of apps as the other components
  @Input() applications: Array<Application> = []; // from applications component
  @Output() setCurrentApp = new EventEmitter(); // to applications component
  @Output() unsetCurrentApp = new EventEmitter(); // to applications component
  @Output() loadMore = new EventEmitter(); // to applications component
  @Output() listPageSizeChange = new EventEmitter(); // to applications component
  @Output() updateResultsChange = new EventEmitter(); // to applications component
  @Output() drawShapesChange = new EventEmitter(); // to applications component
  @Output() clusterAppsChange = new EventEmitter(); // to applications component

  private currentApp: Application = null; // for selecting app in list
  public loading = true;

  constructor(
    public configService: ConfigService, // used in template
    private commentPeriodService: CommentPeriodService, // used in template
    private elementRef: ElementRef
  ) { }

  get clientWidth(): number {
    return this.elementRef.nativeElement.firstElementChild.clientWidth; // div.app-list__container
  }

  public ngOnInit() { }

  // called when application list changes
  public ngOnChanges(changes: SimpleChanges) {
    // if (changes.applications && !changes.applications.firstChange) {
    //   console.log('applications =', this.applications);
    // }
  }

  public ngOnDestroy() { }

  public isCurrentApp(item: Application): boolean {
    return (item === this.currentApp);
  }

  public toggleCurrentApp(item: Application) {
    const index = _.findIndex(this.applications, { _id: item._id });
    if (index >= 0) {
      if (!this.isCurrentApp(item)) {
        this.currentApp = item; // set
        this.setCurrentApp.emit(item);

      } else {
        this.currentApp = null; // unset
        this.unsetCurrentApp.emit(item);
      }
    }
  }

  public loadedApps(): Array<Application> {
    return this.applications.filter(a => a && a.isLoaded);
  }

  public visibleApps(): Array<Application> {
    return this.applications.filter(a => a && a.isVisible);
  }

  public onLoadMoreStart() { this.loading = true; }

  public onLoadMoreEnd() { this.loading = false; }
}
