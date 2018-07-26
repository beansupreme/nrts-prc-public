import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkerPopupComponent } from './marker-popup.component';

describe('MarkerPopupComponent', () => {
  let component: MarkerPopupComponent;
  let fixture: ComponentFixture<MarkerPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MarkerPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkerPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
