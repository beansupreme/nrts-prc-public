import { Component, OnInit, OnChanges, OnDestroy, Input, ApplicationRef, SimpleChanges } from '@angular/core';
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

  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private map: L.Map = null;
  private fgList: L.FeatureGroup[] = []; // list of app FGs (each containing feature layers)
  private markerList: L.Marker[] = []; // list of markers
  private currentMarker: L.Marker = null; // for removing previous marker
  private markerClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40, // NB: change to 0 to disable clustering
    // iconCreateFunction: this.clusterCreate // FUTURE: for custom markers, if needed
  });
  private isUser = false; // to track map change events
  public gotChanges = false; // to reduce initial map change event handling
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  readonly defaultBounds = L.latLngBounds([48, -139], [60, -114]); // all of BC

  // private drawMapStart = 0; // for profiling
  // private animationStart = 0; // for profiling

  constructor(
    private appRef: ApplicationRef,
    public snackBar: MatSnackBar,
    public applicationService: ApplicationService,
    public configService: ConfigService,
    public compileService: CustomCompileService
  ) { }

  // for creating custom cluster icon
  private clusterCreate(cluster): L.Icon | L.DivIcon {
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
        element.onclick = () => self.resetView();

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

    // let tileStart = 0;
    // World_Topo_Map.on('loading', function () {
    //   tileStart = (new Date()).getTime();
    // }, this);
    // World_Topo_Map.on('load', function () {
    //   const delta = (new Date()).getTime() - tileStart;
    //   console.log('tile layer loaded in', delta, 'ms');
    // }, this);

    this.map = L.map('map', {
      zoomControl: false,
      maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)) // the world
    });

    // map state change events
    this.map.on('zoomstart', function () {
      this.isUser = true;
    }, this);

    this.map.on('movestart', function () {
      this.isUser = true;
    }, this);

    this.map.on('resize', function () {
      this.isUser = true;
    }, this);

    // NB: moveend is called after zoomstart, movestart and resize
    this.map.on('moveend', function () {
      // only set visible after init
      if (this.gotChanges && this.isUser) {
        this.isUser = false;
        this.setVisibleDebounced();
      }
      // this.animationStart = (new Date()).getTime(); // assume animation starts when map changes end
    }, this);

    // const mapStart = (new Date()).getTime();
    // this.map.on('load', function () {
    //   const delta = (new Date()).getTime() - mapStart;
    //   console.log('map loaded in', delta, 'ms');
    // }, this);

    // add reset view control
    this.map.addControl(new resetViewControl());

    // add zoom control
    L.control.zoom({ position: 'topright' }).addTo(this.map);

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

    // TODO: restore map bounds or view ?
    // this.fitGlobalBounds(this.configService.mapBounds);
    // this.map.setView(this.configService.mapCenter, this.configService.mapZoom);

    // add scale control
    L.control.scale({ position: 'bottomright' }).addTo(this.map);

    // this.markerClusterGroup.on('animationend', () => {
    //   const delta = (new Date()).getTime() - this.animationStart;
    //   console.log('cluster animation took', delta, 'ms');
    // }, this);
  }

  // called when application list changes
  public ngOnChanges(changes: SimpleChanges) {
    if (changes.applications && !changes.applications.firstChange && changes.applications.currentValue) {
      // console.log('applications =', this.applications);

      this.gotChanges = true;

      // draw the (updated) map
      this.drawMap();
    }
  }

  public ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Called on map state change events.
   * Actual function executes no more than once every 250ms.
   */
  // tslint:disable-next-line:member-ordering
  private setVisibleDebounced = _.debounce(this.setVisible, 250);

  /**
   * Sets which apps are currently visible.
   * NB: Call setVisibleDebounced() instead!
   */
  private setVisible() {
    // console.log('setting visible');
    const bounds = this.map.getBounds();

    // TODO: central place to save map bounds / view ?
    // this.configService.mapBounds = bounds;
    // this.configService.mapCenter = this.map.getCenter();
    // this.configService.mapZoom = this.map.getZoom();

    for (const fg of this.fgList) {
      const fgBounds = fg.getBounds();

      if (!this.configService.doUpdateResults) {
        // show all items even if map moves
        const app = _.find(this.applications, { tantalisID: fg.dispositionId });
        if (app) { app.isVisible = true; }

      } else if (fgBounds && !fgBounds.isValid()) {
        // item without features - make item visible
        const app = _.find(this.applications, { tantalisID: fg.dispositionId });
        if (app) { app.isVisible = true; }

      } else if (fgBounds && fgBounds.isValid() && bounds.intersects(fgBounds)) {
        // bounds intersect - make item visible
        const app = _.find(this.applications, { tantalisID: fg.dispositionId });
        if (app) { app.isVisible = true; }

      } else {
        // invalid bounds, or bounds don't intersect - make item hidden
        const app = _.find(this.applications, { tantalisID: fg.dispositionId });
        if (app) { app.isVisible = false; }
      }
    }
  }

  private fitGlobalBounds(globalBounds: L.LatLngBounds) {
    // use padding to adjust for list and/or filters
    const x = this.configService.isApplistListVisible ? this.applist.clientWidth : 0;
    const y = 0; // this.appfilters.clientHeight; // FUTURE: offset for filter pane, if needed
    const fitBoundsOptions: L.FitBoundsOptions = { paddingTopLeft: L.point(x, y) };

    if (globalBounds && globalBounds.isValid()) {
      this.map.fitBounds(globalBounds, fitBoundsOptions);
    } else {
      this.map.fitBounds(this.defaultBounds, fitBoundsOptions);
    }
  }

  /**
   * Resets map view to display all apps.
   */
  private resetView() {
    // console.log('resetting view');
    const globalFG = L.featureGroup();

    for (const fg of this.fgList) {
      fg.addTo(globalFG);
    }

    // fit the global bounds
    this.fitGlobalBounds(globalFG.getBounds());
  }

  // private _onLayerAdd() {
  //   const delta = (new Date()).getTime() - this.drawMapStart;
  //   console.log('cluster layer added in', delta, 'ms');
  // }

  /**
   * Redraws all map layers.
   */
  // TODO: only draw the new apps
  private drawMap() {
    // console.log('drawing map');

    // this.drawMapStart = (new Date()).getTime();
    // if (this.gotChanges) {
    //   this.markerClusterGroup.off('layeradd', this._onLayerAdd, this);
    //   this.markerClusterGroup.on('layeradd', this._onLayerAdd, this);
    // }

    const globalFG = L.featureGroup();

    // remove and clear all layers for all apps
    for (const fg of this.fgList) {
      fg.removeFrom(this.map);
      fg.clearLayers();
    }

    // remove and clear all markers
    this.markerClusterGroup.removeFrom(this.map);
    this.markerClusterGroup.clearLayers();

    // empty the lists
    this.fgList.length = 0;
    this.markerList.length = 0;

    this.applications.forEach(app => {
      const appFG = L.featureGroup(); // layers for current app
      appFG.dispositionId = app.tantalisID;

      // // draw features for this app
      // app.features.forEach(f => {
      //   const feature = JSON.parse(JSON.stringify(f));
      //   // needs to be valid GeoJSON
      //   delete f.geometry_name;
      //   const featureObj: GeoJSON.Feature<any> = feature;
      //   const layer = L.geoJSON(featureObj, {
      //     filter: function (geoJsonFeature) {
      //       return true; // FUTURE: make this feature invisible (not shown on map), if needed
      //     }
      //   });
      //   // ref: https://leafletjs.com/reference-1.3.0.html#popup
      //   const popupOptions = {
      //     maxWidth: 400, // worst case (Pixel 2)
      //     className: 'map-popup-content', // FUTURE: for better styling control, if needed
      //     autoPanPadding: L.point(40, 40)
      //   };
      //   const htmlContent =
      //     '<div class="app-detail-title">'
      //     + '<span class="client-name__label">Client Name</span>'
      //     + '<span class="client-name__value">' + app.client + '</span>'
      //     + '</div>'
      //     + '<div class="app-details">'
      //     + '<div>'
      //     //+ '<span class="name">Application Description</span>'
      //     + '<span class="value">' + app.description + '</span>'
      //     + '</div>'
      //     + '<hr class="mt-3 mb-3">'
      //     + '<ul class="nv-list">'
      //     + '<li><span class="name">Crown Lands File #:</span><span class="value"' + featureObj.properties.CROWN_LANDS_FILE + '</span></li>'
      //     + '<li><span class="name">Disposition Transaction ID:</span><span class="value">' + featureObj.properties.DISPOSITION_TRANSACTION_SID + '</span></li>'
      //     + '<li><span class="name">Location:</span><span class="value">' + app.location + '</span></li>'
      //     //+ '<li><span class="name">Shape:</span><span class="value">' + featureObj.properties.INTRID_SID + '</span></li>'
      //     //+ '<li><span class="name">Purpose/Subpurpose:</span><span class="value">' + featureObj.properties.TENURE_PURPOSE + '/' + featureObj.properties.TENURE_SUBPURPOSE + '</span></li>'
      //     //+ '<li><span class="name">Stage:</span><span class="value">' + featureObj.properties.TENURE_STAGE + '</span></li>'
      //     //+ '<li><span class="name">Status:</span><span class="value">' + featureObj.properties.TENURE_STATUS + '</span></li>'
      //     //+ '<li><span class="name">Hectares:</span><span class="value">' + featureObj.properties.TENURE_AREA_IN_HECTARES + '</span></li>'
      //     + '</ul>'
      //     + '</div>';
      //   const popup = L.popup(popupOptions).setContent(htmlContent);
      //   layer.bindPopup(popup);
      //   layer.addTo(appFG);
      // });
      // this.fgList.push(appFG); // save to list
      // if (this.configService.doDrawShapes) { appFG.addTo(this.map); } // add this FG to map
      // appFG.addTo(globalFG); // for bounds

      // add marker
      if (app.latitude !== 0 && app.longitude !== 0) {
        const title = `Applicant: ${app.client}\n`
          + `Purpose: ${app.purpose} / ${app.subpurpose}\n`
          + `Status: ${this.applicationService.getStatusString(app.status)}\n`
          + `Region: ${this.applicationService.regions[app.region]}`;
        const marker = L.marker(L.latLng(app.latitude, app.longitude), { title: title })
          .setIcon(markerIconYellow)
          .on('click', L.Util.bind(this.onMarkerClick, this, this.applications.indexOf(app)));
        marker.dispositionId = app.tantalisID;
        this.markerList.push(marker); // save to list
        marker.addTo(this.markerClusterGroup);
      }
    });

    // add markers group to map
    this.markerClusterGroup.addTo(this.map);
    this.markerClusterGroup.addTo(globalFG); // needed because currently we aren't looking at shapes

    // fit the global bounds
    this.fitGlobalBounds(globalFG.getBounds());

    // DEBUGGING
    // let n = 0;
    // this.map.eachLayer(() => n++);
    // console.log('# map layers =', n);
    // console.log('# marker layers =', this.markerClusterGroup.getLayers().length);
  }

  private onMarkerClick(...args: any[]) {
    const index = args[0] as number;
    const marker = args[1].target as L.Marker;

    // this.applist.toggleCurrentApp(this.applications[index]); // FUTURE: update selected item in app list

    // if data is already loaded, show the popup right away
    // otherwise load the application first
    if (this.applications[index].isLoaded) {
      this.showMarkerPopup(marker, this.applications[index]);
    } else {
      this.snackBarRef = this.snackBar.open('Loading application ...');
      this.applicationService.getById(this.applications[index]._id)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => {
            this.snackBarRef.dismiss();
            // update this element in the main list
            this.applications[index] = application;
            this.showMarkerPopup(marker, application);
          },
          error => {
            console.log(error);
            // NB: this snackbar will automatically dismiss the previous snackbar
            this.snackBarRef = this.snackBar.open('Uh-oh, couldn\'t load application', null, { duration: 3000 });
          });
    }
  }

  private showMarkerPopup(marker: L.Marker, app: Application) {
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
        this.centerMap(marker.getLatLng());
        // TODO: should zoom in to this app
      }
    }
  }

  /**
   * Center map on specified point, applying offset if needed.
   */
  // TODO: register for list/filter changes and apply offset accordingly ?
  private centerMap(latlng: L.LatLng) {
    let point = this.map.latLngToLayerPoint(latlng);

    if (this.configService.isApplistListVisible) { point = point.subtract([(this.applist.clientWidth / 2), 0]); }
    // if (this.configService.isApplistFiltersVisible) { point = point.subtract([0, (this.appfilters.clientHeight / 2)]); } // FUTURE: offset for filter pane, if needed

    this.map.panTo(this.map.layerPointToLatLng(point));
  }

  /**
   * Called when Update Results checkbox has changed.
   */
  // FUTURE: change doUpdateResults to observable and subscribe to changes ?
  public onUpdateResultsChange() {
    this.setVisibleDebounced();
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
    const x = this.configService.isApplistListVisible ? -this.applist.clientWidth / 2 : this.applist.clientWidth / 2;
    const y = 0;
    this.map.panBy(L.point(x, y));
  }
}
