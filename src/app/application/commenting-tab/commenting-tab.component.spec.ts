import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentingTabComponent } from './commenting-tab.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CommentService } from 'app/services/comment.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DialogService } from 'ng2-bootstrap-modal';

describe('CommentingTabComponent', () => {
  let component: CommentingTabComponent;
  let fixture: ComponentFixture<CommentingTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CommentingTabComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: CommentService },
        { provide: CommentPeriodService },
        { provide: DialogService },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentingTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
