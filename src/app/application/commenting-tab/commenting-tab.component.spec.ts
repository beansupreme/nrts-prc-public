import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentingTabComponent } from './commenting-tab.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CommentService } from 'app/services/comment.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DialogService } from 'ng2-bootstrap-modal';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { Application } from 'app/models/application';
import { Comment } from 'app/models/comment';
import { ActivatedRoute, Router } from '@angular/router';

describe('CommentingTabComponent', () => {
  let component: CommentingTabComponent;
  let fixture: ComponentFixture<CommentingTabComponent>;

  const existingApplication = new Application();
  const validRouteData = {application: existingApplication};

  class ActivatedRouteStub {
    constructor(initialData) {
      this.setData(initialData)
    }

    public parent = {
      data: Observable.of({})
    };

    public setData(data: {}) {
      this.parent.data = Observable.of(data);
    }
  }

  const activatedRouteStub = new ActivatedRouteStub(validRouteData);

  const routerSpy = {
    navigate: jasmine.createSpy('navigate')
  };

  const commentPeriodServiceStub = {
    isOpen() {
      return true;
    }
  };

  const commentServiceStub = {
    getAllByApplicationId() {
      return Observable.of([new Comment({})]);
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CommentingTabComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: CommentService, useValue: commentServiceStub },
        { provide: CommentPeriodService, useValue: commentPeriodServiceStub },
        { provide: DialogService },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Router, useValue: routerSpy },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentingTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('when the application is retrievable from the route', () => {
    beforeEach(() => {
      activatedRouteStub.setData(validRouteData);
    });

    it('sets the component application to the one from the route', () => {
      expect(component.application).toEqual(existingApplication);
    });
  });

  describe('when the application is not available from the route', () => {
    beforeEach(() => {
      activatedRouteStub.setData({something: 'went wrong'});
    });

    it('redirects to /applications', () => {
      component.ngOnInit();
      expect(component.loading).toEqual(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/applications']);
    });
  });
});
