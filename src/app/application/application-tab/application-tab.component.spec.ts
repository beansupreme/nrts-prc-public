import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationTabComponent } from './application-tab.component';
import { NewlinesPipe } from 'app/pipes/newlines.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiService } from 'app/services/api';

describe('ApplicationTabComponent', () => {
  let component: ApplicationTabComponent;
  let fixture: ComponentFixture<ApplicationTabComponent>;
  const apiServiceStub = {
    getDocumentUrl() {
      return 'http://prc-api/documents/1/download';
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ApplicationTabComponent, NewlinesPipe],
      providers: [
        { provide: ApiService, useValue: apiServiceStub },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });

  xit('renders the document url and document file name on the page', () => {
    const fixture = TestBed.createComponent(ApplicationTabComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    // expect(compiled.querySelector('span.navbar-brand__title').textContent).toContain('Applications, Comments & Reasons for Decision');
  });
});
