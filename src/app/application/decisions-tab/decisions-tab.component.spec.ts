import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DecisionsTabComponent } from './decisions-tab.component';
import { NewlinesPipe } from 'app/pipes/newlines.pipe';
import { VarDirective } from 'app/utils/ng-var.directive';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';

describe('DecisionsTabComponent', () => {
  let component: DecisionsTabComponent;
  let fixture: ComponentFixture<DecisionsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DecisionsTabComponent, 
        NewlinesPipe,
        VarDirective
      ],
      imports: [RouterTestingModule],
      providers: [
        { provide: ApiService },
        { provide: ApplicationService },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DecisionsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
