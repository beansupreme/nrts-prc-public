import { TestBed, inject } from '@angular/core/testing';
import { CustomCompileService } from './customcompile.service';

describe('CustomCompileService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomCompileService]
    });
  });

  it('should be created', inject([CustomCompileService], (service: CustomCompileService) => {
    expect(service).toBeTruthy();
  }));
});
