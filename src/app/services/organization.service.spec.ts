import { TestBed, inject } from '@angular/core/testing';
import { OrganizationService } from './organization.service';
import { ApiService } from './api';

describe('OrganizationService', () => {
  const apiServiceSpy = jasmine.createSpyObj('ApiService', [
    'getOrganizations',
    'getOrganization'
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrganizationService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });
  });

  it('should be created', inject([OrganizationService], (service: OrganizationService) => {
    expect(service).toBeTruthy();
  }));
});
