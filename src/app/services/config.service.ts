import { Injectable } from '@angular/core';
import * as L from 'leaflet';

//
// This service/class provides a centralized place to persist config values
// (eg, to share values between multiple components).
//

@Injectable()
export class ConfigService {

  // defaults
  private _isApplistListVisible = false;
  private _isApplistFiltersVisible = false;
  private _listPageSize = 10;
  private _doUpdateResults = true;
  private _doDrawShapes = false;
  private _doClusterApps = true;

  // TODO: store these in URL instead
  private _baseLayerName = 'World Imagery'; // NB: must match a valid base layer name
  private _mapBounds: L.LatLngBounds = null;

  constructor() { }

  // called by app constructor
  public init() {
    // FUTURE: load settings from window.localStorage?
  }

  // called by app constructor - for future use
  public destroy() {
    // FUTURE: save settings to window.localStorage?
  }

  get isApplistListVisible(): boolean { return this._isApplistListVisible; }
  set isApplistListVisible(val: boolean) { this._isApplistListVisible = val; }

  get isApplistFiltersVisible(): boolean { return this._isApplistFiltersVisible; }
  set isApplistFiltersVisible(val: boolean) { this._isApplistFiltersVisible = val; }

  get listPageSize(): number { return this._listPageSize; }
  set listPageSize(val: number) { this._listPageSize = val; }

  get doUpdateResults(): boolean { return this._doUpdateResults; }
  set doUpdateResults(val: boolean) { this._doUpdateResults = val; }

  get doDrawShapes(): boolean { return this._doDrawShapes; }
  set doDrawShapes(val: boolean) { this._doDrawShapes = val; }

  get doClusterApps(): boolean { return this._doClusterApps; }
  set doClusterApps(val: boolean) { this._doClusterApps = val; }

  get baseLayerName(): string { return this._baseLayerName; }
  set baseLayerName(val: string) { this._baseLayerName = val; }

  get mapBounds(): L.LatLngBounds { return this._mapBounds; }
  set mapBounds(val: L.LatLngBounds) { this._mapBounds = val; }

}
