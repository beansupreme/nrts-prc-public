import { Injectable, ApplicationRef, Injector, ComponentFactoryResolver } from '@angular/core';

//
// $compile for Angular 4 - used to compile a given component and return its HTML
// Ref: https://github.com/darkguy2008/leaflet-angular4-issue/blob/master/src/app.ts
//

@Injectable()
export class CustomCompileService {
  private appRef: ApplicationRef = null;

  constructor(
    private injector: Injector,
    private resolver: ComponentFactoryResolver
  ) { }

  public configure(appRef: ApplicationRef) {
    this.appRef = appRef;
  }

  public compile(component: any, onAttach: Function = null): HTMLDivElement {
    if (!this.appRef) {
      return null; // error - must call configure first!
    }

    const compFactory = this.resolver.resolveComponentFactory(component);
    const compRef = compFactory.create(this.injector);

    if (onAttach) {
      onAttach(compRef);
    }

    this.appRef.attachView(compRef.hostView);
    compRef.onDestroy(() => this.appRef.detachView(compRef.hostView));

    const div = document.createElement('div');
    div.appendChild(compRef.location.nativeElement);
    return div;
  }
}
