import { TestBed, inject } from '@angular/core/testing';
import { ApplicationResolver } from './application-resolver.service';
import { ApplicationService } from 'app/services/application.service';

describe('ApplicationResolver', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationResolver,
        { provide: ApplicationService }
      ]
    });
  });

  it('should be created', inject([ApplicationResolver], (service: ApplicationResolver) => {
    expect(service).toBeTruthy();
  }));
});
