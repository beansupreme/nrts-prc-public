import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, ApplicationRef, SimpleChanges, ElementRef } from '@angular/core';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import 'leaflet';
import 'leaflet.markercluster';
import * as _ from 'lodash';

import { Application } from 'app/models/application';
import { ApplicationService } from 'app/services/application.service';
import { ConfigService } from 'app/services/config.service';
import { CustomCompileService } from 'app/services/customcompile.service';
import { MarkerPopupComponent } from '../marker-popup/marker-popup.component';

declare module 'leaflet' {
  export interface FeatureGroup<P = any> {
    dispositionId: number;
  }
  export interface Marker<P = any> {
    dispositionId: number;
  }
}

const L = window['L'];

const markerIconYellow = L.icon({
  iconUrl: 'assets/images/marker-icon-yellow.svg',
  iconRetinaUrl: 'assets/images/marker-icon-2x-yellow.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28]
});

const markerIconYellowLg = L.icon({
  iconUrl: 'assets/images/marker-icon-yellow-lg.svg',
  iconRetinaUrl: 'assets/images/marker-icon-2x-yellow-lg.svg',
  iconSize: [50, 82],
  iconAnchor: [25, 82],
  // popupAnchor: [1, -34], // TODO: update, if needed
  // tooltipAnchor: [16, -28] // TODO: update, if needed
});

@Component({
  selector: 'app-applist-map',
  templateUrl: './applist-map.component.html',
  styleUrls: ['./applist-map.component.scss']
})

export class ApplistMapComponent implements OnInit, OnChanges, OnDestroy {
  // NB: this component is bound to the same list of apps as the other components
  @Input() applications: Array<Application> = []; // from applications component
  @Input() applist;
  @Input() appfilters;
  @Output() reloadList = new EventEmitter(); // to applications component

  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private map: L.Map = null;
  private fgList: Array<L.FeatureGroup> = []; // list of app FGs (each containing feature layers)
  private markerList: Array<L.Marker> = []; // list of markers
  private currentMarker: L.Marker = null; // for removing previous marker
  private markerClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40, // NB: change to 0 to disable clustering
    // iconCreateFunction: this._clusterCreate // FUTURE: for custom markers, if needed
  });
  private oldSize: L.Point = null; // for map resizing
  public gotChanges = false; // to reduce initial map change event handling
  public loading = false; // to reduce calls to set visible apps
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  readonly defaultBounds = L.latLngBounds([48, -139], [60, -114]); // all of BC

  constructor(
    private appRef: ApplicationRef,
    private elementRef: ElementRef,
    public snackBar: MatSnackBar,
    public applicationService: ApplicationService,
    public configService: ConfigService,
    public compileService: CustomCompileService
  ) { }

  // for creating custom cluster icon
  private _clusterCreate(cluster): L.Icon | L.DivIcon {
    const html = cluster.getChildcount().toString();
    return L.divIcon({ html: html, className: 'my-cluster', iconSize: L.point(40, 40) });
  }

  public ngOnInit() {
    const self = this; // for nested functions

    this.compileService.configure(this.appRef); // init

    // custom control to reset map view
    const resetViewControl = L.Control.extend({
      onAdd: function () {
        const element = L.DomUtil.create('i', 'material-icons leaflet-bar leaflet-control leaflet-control-custom');

        element.title = 'Reset view';
        element.innerText = 'refresh'; // material icon name
        element.style.width = '34px';
        element.style.height = '34px';
        element.style.lineHeight = '30px';
        element.style.textAlign = 'center';
        element.style.cursor = 'pointer';
        element.style.backgroundColor = '#fff';
        element.onmouseover = () => element.style.backgroundColor = '#f4f4f4';
        element.onmouseout = () => element.style.backgroundColor = '#fff';
        element.onclick = () => self._resetView();

        // prevent underlying map actions for these events
        L.DomEvent.disableClickPropagation(element); // includes double-click
        L.DomEvent.disableScrollPropagation(element);

        return element;
      },
    });

    const Esri_OceanBasemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
      maxZoom: 13,
      noWrap: true
    });
    const Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
      maxZoom: 16,
      noWrap: true
    });
    const OpenMapSurfer_Roads = L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
      attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
      noWrap: true
    });
    const World_Topo_Map = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
      maxZoom: 16,
      noWrap: true
    });
    const World_Imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 17,
      noWrap: true
    });

    this.map = L.map('map', {
      zoomControl: false, // will be added manually (below)
      maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)), // restrict view to "the world"
      zoomSnap: 0.1 // for greater granularity when fitting bounds
    });

    // map state change events
    // this.map.on('zoomstart', function () {
    //   console.log('zoomstart');
    // }, this);

    // this.map.on('movestart', function () {
    //   console.log('movestart');
    // }, this);

    this.map.on('resize', function (e: L.ResizeEvent) {
      // console.log('resize');
      if (this.oldSize === null) {
        this.oldSize = e.oldSize;
      }
    }, this);

    // NB: moveend is called after zoom, move and resize
    this.map.on('moveend', function () {
      // console.log('moveend');
      if (this.oldSize !== null) {
        // zoom to approximately the same scale as before resize
        const scale = this._distance(this.map.getSize()) / this._distance(this.oldSize);
        const zoom = this.map.getScaleZoom(scale, this.map.getZoom());
        this.oldSize = null; // must clear this before calling setZoom()
        this.map.setZoom(zoom);
      } else if (!this.loading) {
        // update list of visible apps
        this._setVisibleDebounced();
      }
    }, this);

    // add markers group
    this.map.addLayer(this.markerClusterGroup);

    // add reset view control
    this.map.addControl(new resetViewControl());

    // add zoom control
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // add scale control
    L.control.scale({ position: 'bottomright' }).addTo(this.map);

    // add base maps layers control
    const baseLayers = {
      'Ocean Base': Esri_OceanBasemap,
      'Nat Geo World Map': Esri_NatGeoWorldMap,
      'Open Surfer Roads': OpenMapSurfer_Roads,
      'World Topographic': World_Topo_Map,
      'World Imagery': World_Imagery
    };
    L.control.layers(baseLayers).addTo(this.map);

    // load base layer
    for (const key of Object.keys(baseLayers)) {
      if (key === this.configService.baseLayerName) {
        this.map.addLayer(baseLayers[key]);
        break;
      }
    }

    // save any future base layer changes
    this.map.on('baselayerchange', function (e: L.LayersControlEvent) {
      this.configService.baseLayerName = e.name;
    }, this);

    // FUTURE: restore map bounds ?
    // (bounds will work with different map sizes)
    // this.fitGlobalBounds(this.configService.mapBounds);
  }

  private _distance(size: L.Point): number {
    return Math.sqrt(size.x * size.x + size.y * size.y);
  }

  // called when application list changes
  public ngOnChanges(changes: SimpleChanges) {
    if (changes.applications && !changes.applications.firstChange) {
      // console.log('applications =', this.applications);

      this.gotChanges = true;

      // update the map
      const deleted = _.difference(changes.applications.previousValue, changes.applications.currentValue) as Array<Application>;
      const added = _.difference(changes.applications.currentValue, changes.applications.previousValue) as Array<Application>;
      this._drawMap(deleted, added);
    }
  }

  public ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * May be called on map state change events.
   * Actual function executes no more than once every 250ms.
   */
  // tslint:disable-next-line:member-ordering
  private _setVisibleDebounced = _.debounce(this._setVisible, 250);

  /**
   * Sets which apps are currently visible.
   * NB: Call _setVisibleDebounced() instead!
   */
  private _setVisible() {
    // console.log('setting visible');
    const mapBounds = this.map.getBounds();

    // FUTURE: central place to save map bounds ?
    // this.configService.mapBounds = bounds;

    for (const marker of this.markerList) {
      const app = _.find(this.applications, { tantalisID: marker.dispositionId });
      if (app) { // safety check
        const markerLatLng = marker.getLatLng();

        if (!this.configService.doUpdateResults) {
          // show all items even if map moves
          app.isVisible = true;

        } else if (mapBounds.contains(markerLatLng)) {
          // map contains marker - make item visible
          app.isVisible = true;

        } else {
          // map doesn't contains marker - make item hidden and unload it from list
          app.isVisible = false;
          app.isLoaded = false;
        }
      }
    }

    // reload list per new app visibility
    this.reloadList.emit();
  }

  private _fitGlobalBounds(bounds: L.LatLngBounds) {
    // console.log('fitting bounds');
    // use padding to adjust for list and/or filters
    const x = this.configService.isApplistListVisible ? this.applist.clientWidth : 0;
    const y = this.appfilters.clientHeight; // filters are always visible
    const fitBoundsOptions: L.FitBoundsOptions = {
      paddingTopLeft: L.point(x, y),
      // disable animation to prevent known bug where zoom is sometimes incorrect
      // ref: https://github.com/Leaflet/Leaflet/issues/3249
      animate: false
    };

    if (bounds && bounds.isValid()) {
      this.map.fitBounds(bounds, fitBoundsOptions);
    } else {
      this.map.fitBounds(this.defaultBounds, fitBoundsOptions);
    }
  }

  /**
   * Resets map view to display all apps.
   */
  private _resetView() {
    // console.log('resetting view');
    const globalFG = L.featureGroup();

    for (const marker of this.markerList) {
      marker.addTo(globalFG);
    }

    for (const fg of this.fgList) {
      fg.addTo(globalFG);
    }

    // fit the global bounds
    this._fitGlobalBounds(globalFG.getBounds());
  }

  /**
   * Removes deleted / draws added applications.
   */
  private _drawMap(deleted: Application[], added: Application[]) {
    // console.log('drawing map');
    // console.log('deleted =', deleted);
    // console.log('added =', added);

    // remove deleted apps from map and lists
    // NB: use for() instead of deleted.foreach because this needs to be synchronous
    for (const app of deleted) {
      if (app) { // safety check
        const fgIndex = _.findIndex(this.fgList, { dispositionId: app.tantalisID });
        if (fgIndex >= 0) {
          const fgs = this.fgList.splice(fgIndex, 1);
          this.map.removeLayer(fgs[0]);
          fgs[0].clearLayers();
        }

        const markerIndex = _.findIndex(this.markerList, { dispositionId: app.tantalisID });
        if (markerIndex >= 0) {
          const markers = this.markerList.splice(markerIndex, 1);
          this.markerClusterGroup.removeLayer(markers[0]);
        }
      }
    }

    // draw added apps
    for (const app of added) {
      //#region SHAPE CODE TEMPORARILY DISABLED - DO NOT DELETE
      if (this.configService.doDrawShapes) {
        const appFG = L.featureGroup(); // layers for this app
        appFG.dispositionId = app.tantalisID;

        // draw features for this app
        for (const f of app.features) {
          const feature = JSON.parse(JSON.stringify(f));
          // needs to be valid GeoJSON
          delete f.geometry_name;
          const featureObj: GeoJSON.Feature<any> = feature;
          const layer = L.geoJSON(featureObj, {
            filter: function (geoJsonFeature) {
              return true; // FUTURE: make this feature invisible (not shown on map), if needed
            }
          });
          // ref: https://leafletjs.com/reference-1.3.0.html#popup
          const popupOptions = {
            maxWidth: 400, // worst case (Pixel 2)
            className: 'map-popup-content', // FUTURE: for better styling control, if needed
            autoPanPadding: L.point(40, 40)
          };
          const htmlContent =
            '<div class="app-detail-title">'
            + '<span class="client-name__label">Client Name</span>'
            + '<span class="client-name__value">' + app.client + '</span>'
            + '</div>'
            + '<div class="app-details">'
            + '<div>'
            // + '<span class="name">Application Description</span>'
            + '<span class="value">' + app.description + '</span>'
            + '</div>'
            + '<hr class="mt-3 mb-3">'
            + '<ul class="nv-list">'
            + '<li><span class="name">Crown Lands File #:</span><span class="value"' + featureObj.properties.CROWN_LANDS_FILE + '</span></li>'
            + '<li><span class="name">Disposition Transaction ID:</span><span class="value">' + featureObj.properties.DISPOSITION_TRANSACTION_SID + '</span></li>'
            + '<li><span class="name">Location:</span><span class="value">' + app.location + '</span></li>'
            // + '<li><span class="name">Shape:</span><span class="value">' + featureObj.properties.INTRID_SID + '</span></li>'
            // + '<li><span class="name">Purpose/Subpurpose:</span><span class="value">' + featureObj.properties.TENURE_PURPOSE + '/' + featureObj.properties.TENURE_SUBPURPOSE + '</span></li>'
            // + '<li><span class="name">Stage:</span><span class="value">' + featureObj.properties.TENURE_STAGE + '</span></li>'
            // + '<li><span class="name">Status:</span><span class="value">' + featureObj.properties.TENURE_STATUS + '</span></li>'
            // + '<li><span class="name">Hectares:</span><span class="value">' + featureObj.properties.TENURE_AREA_IN_HECTARES + '</span></li>'
            + '</ul>'
            + '</div>';
          const popup = L.popup(popupOptions).setContent(htmlContent);
          layer.bindPopup(popup);
          layer.addTo(appFG);
        }
        this.fgList.push(appFG); // save to list
        this.map.addLayer(appFG); // add to map
      }
      //#endregion

      // add marker
      if (app.latitude !== 0 && app.longitude !== 0) {
        const title = `Applicant: ${app.client}\n`
          + `Purpose: ${app.purpose} / ${app.subpurpose}\n`
          + `Status: ${this.applicationService.getStatusString(app.status)}\n`
          + `Region: ${this.applicationService.getRegionString(app.region)}`;
        const marker = L.marker(L.latLng(app.latitude, app.longitude), { title: title })
          .setIcon(markerIconYellow)
          .on('click', L.Util.bind(this._onMarkerClick, this, this.applications.indexOf(app)));
        marker.dispositionId = app.tantalisID;
        this.markerList.push(marker); // save to list
        this.markerClusterGroup.addLayer(marker); // save to marker/clusters layer
      }
    }

    // fit view to shapes/markers
    this._resetView();

    // DEBUGGING
    // let n = 0;
    // this.map.eachLayer(() => n++);
    // console.log('# map layers =', n);
    // console.log('# marker layers =', this.markerClusterGroup.getLayers().length);
  }

  private _onMarkerClick(...args: any[]) {
    const index = args[0] as number;
    const marker = args[1].target as L.Marker;

    // this.applist.toggleCurrentApp(this.applications[index]); // FUTURE: update selected item in app list

    // if data is already loaded, show the popup right away
    // otherwise load the application first
    if (this.applications[index].isLoaded) {
      this._showMarkerPopup(marker, this.applications[index]);
    } else {
      this.snackBarRef = this.snackBar.open('Loading application ...');
      this.applicationService.getById(this.applications[index]._id)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => {
            this.snackBarRef.dismiss();
            // update this application in the main list
            // NB: this does not cause change detection (but we don't want it to)
            this.applications[index] = application;
            this._showMarkerPopup(marker, application);
          },
          error => {
            console.log(error);
            // NB: this snackbar will automatically dismiss the previous snackbar
            this.snackBarRef = this.snackBar.open('Uh-oh, couldn\'t load application', null, { duration: 3000 });
          });
    }
  }

  private _showMarkerPopup(marker: L.Marker, app: Application) {
    const popupOptions = {
      className: 'map-popup-content',
      autoPanPadding: L.point(40, 40)
    };

    L.popup(popupOptions)
      .setLatLng(marker.getLatLng())
      .setContent(this.compileService.compile(MarkerPopupComponent, (f) => { f.instance.app = app; }))
      .openOn(this.map);
  }

  /**
   * Called when list component selects or unselects an app.
   */
  // TODO: if app is in a cluster, highlight the cluster (PRC-562)
  public onHighlightApplication(app: Application, show: boolean) {
    // reset icon on previous marker, if any
    if (this.currentMarker) {
      this.currentMarker.setIcon(markerIconYellow);
      this.currentMarker = null;
    }

    // set icon on new marker
    if (show) {
      const marker = _.find(this.markerList, { dispositionId: app.tantalisID });
      if (marker) {
        this.currentMarker = marker;
        marker.setIcon(markerIconYellowLg);
        // this._centerMap(marker.getLatLng()); // don't center map
      }
    }
  }

  /**
   * Center map on specified point, applying offset if needed.
   */
  private _centerMap(latlng: L.LatLng) {
    let point = this.map.latLngToLayerPoint(latlng);

    if (this.configService.isApplistListVisible) { point = point.subtract([(this.applist.clientWidth / 2), 0]); }
    point = point.subtract([0, (this.appfilters.clientHeight / 2)]); // filters are always visible

    this.map.panTo(this.map.layerPointToLatLng(point));
  }

  /**
   * Called when Draw Shapes checkbox has changed.
   */
  // FUTURE: change doDrawShapes to observable and subscribe to changes ?
  public onDrawShapesChange() {
    for (const fg of this.fgList) {
      if (this.configService.doDrawShapes) {
        fg.addTo(this.map);
      } else {
        fg.removeFrom(this.map);
      }
    }
  }

  /**
   * Called when Cluster Applications checkbox has changed.
   */
  // FUTURE: change doClusterApps to observable and subscribe to changes ?
  public onClusterAppsChange() {
    // TODO: implement, if needed
  }

  /**
   * Called when list component visibility is toggled.
   */
  public toggleAppList() {
    this.configService.isApplistListVisible = !this.configService.isApplistListVisible;

    // NB: panBy() works nicely except it causes move events - which updates view, list, etc - which that we don't want
    // const x = this.configService.isApplistListVisible ? -this.applist.clientWidth / 2 : this.applist.clientWidth / 2;
    // const y = 0;
    // this.map.panBy(L.point(x, y));

    // offset the map element itself
    // NB: this may move some markers out of view (but still 'visible')
    //     but it's better behaviour than updating the list
    const map = this.elementRef.nativeElement.firstElementChild.firstElementChild; // div#map
    if (map) {
      const val = this.configService.isApplistListVisible ? this.applist.clientWidth / 2 : 0;
      map.style.setProperty('left', val + 'px');
    }
  }

  // FUTURE: change ApplicationsComponent.isLoading() to observable and subscribe to changes ?
  // ref: https://github.com/escardin/angular2-community-faq/blob/master/services.md#how-do-i-communicate-between-components-using-a-shared-service
  // ref: https://stackoverflow.com/questions/34700438/global-events-in-angular
  public onLoadStart() { this.loading = true; }
  public onLoadEnd() { this.loading = false; }
}
