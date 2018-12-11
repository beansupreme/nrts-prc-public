import { TestBed, inject } from '@angular/core/testing';
import { CommentPeriodService } from './commentperiod.service';
import { ApiService } from './api';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { CommentPeriod } from 'app/models/commentperiod';

describe('CommentPeriodService', () => {
  let service: CommentPeriodService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: jasmine.createSpyObj('ApiService', [
            'getPeriodsByAppId',
            'handleError'
          ])
        },
        CommentPeriodService
      ]
    });

    service = TestBed.get(CommentPeriodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllByApplicationId', () => {
    let apiSpy;
    beforeEach(() => {
      apiSpy = TestBed.get(ApiService);
    });

    describe('when no comment periods are returned by the Api', () => {
      it('returns an empty CommentPeriod array', () => {
        apiSpy.getPeriodsByAppId.and.returnValue(
          Observable.of({ text: () => {} })
        );

        service
          .getAllByApplicationId('appId')
          .subscribe(result => expect(result).toEqual([] as CommentPeriod[]));
      });
    });

    describe('when one comment period is returned by the Api', () => {
      it('returns an array with one CommentPeriod element', () => {
        apiSpy.getPeriodsByAppId.and.returnValue(
          Observable.of({ text: () => 'notNull', json: () => [{ _id: 1 }] })
        );

        service
          .getAllByApplicationId('appId')
          .subscribe(result =>
            expect(result).toEqual([new CommentPeriod({ _id: 1 })])
          );
      });
    });

    describe('when multiple comment periods are returned by the Api', () => {
      it('returns an array with multiple CommentPeriod elements', () => {
        apiSpy.getPeriodsByAppId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [{ _id: 1 }, { _id: 2 }, { _id: 3 }]
          })
        );

        service
          .getAllByApplicationId('appId')
          .subscribe(result =>
            expect(result).toEqual([
              new CommentPeriod({ _id: 1 }),
              new CommentPeriod({ _id: 2 }),
              new CommentPeriod({ _id: 3 })
            ])
          );
      });
    });

    describe('when an exception is thrown', () => {
      it('ApiService.handleError is called and the error is re-thrown', () => {
        apiSpy.getPeriodsByAppId.and.returnValue(
          Observable.of({
            text: () => {
              throw Error('someError');
            }
          })
        );
        apiSpy.handleError.and.callFake(error => {
          expect(error).toEqual(Error('someError'));
          return Observable.throw(Error('someRethrownError'));
        });

        service.getAllByApplicationId('appId').subscribe(
          res => {},
          err => {
            expect(err).toEqual(Error('someRethrownError'));
          }
        );
      });
    });
  });
});
