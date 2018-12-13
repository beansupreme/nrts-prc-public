import { TestBed } from '@angular/core/testing';
import { ApiService } from './api';
import { DecisionService } from './decision.service';
import { DocumentService } from './document.service';

describe('DecisionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: jasmine.createSpyObj('ApiService', [
            'getDecisionByAppId',
            'handleError'
          ])
        },
        {
          provide: DocumentService,
          useValue: jasmine.createSpyObj('DocumentService', [
            'getAllByDecisionId'
          ])
        },
        DecisionService
      ]
    });
  });

  it('should be created', () => {
    const service: DecisionService = TestBed.get(DecisionService);
    expect(service).toBeTruthy();
  });
});
