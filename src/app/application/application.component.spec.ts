import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationComponent } from './application.component';
import { NewlinesPipe } from 'app/pipes/newlines.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfigService } from 'app/services/config.service';
import { ApplicationService } from 'app/services/application.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';

describe('ApplicationComponent', () => {
  let component: ApplicationComponent;
  let fixture: ComponentFixture<ApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationComponent, NewlinesPipe],
      imports: [RouterTestingModule, NgbModule.forRoot()],
      providers: [
        { provide: ConfigService },
        { provide: ApplicationService },
        { provide: CommentPeriodService },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
