import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';


export class ActivatedRouteStub {
  constructor(initialData) {
    this.setParentData(initialData)
  }

  public parent = {
    data: Observable.of({})
  };

  public setParentData(data: {}) {
    this.parent.data = Observable.of(data);
  }
}

export default ActivatedRouteStub;