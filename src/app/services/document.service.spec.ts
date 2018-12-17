import { TestBed, async } from '@angular/core/testing';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { ApiService } from './api';
import { DocumentService } from './document.service';
import { Document } from 'app/models/document';

describe('DocumentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: jasmine.createSpyObj('ApiService', [
            'getDocumentsByAppId',
            'getDocumentsByCommentId',
            'getDocumentsByDecisionId',
            'getDocument',
            'uploadDocument',
            'handleError'
          ])
        },
        DocumentService
      ]
    });
  });

  it('should be created', () => {
    const service: DocumentService = TestBed.get(DocumentService);
    expect(service).toBeTruthy();
  });

  describe('getAllByApplicationId', () => {
    let service: DocumentService;
    let apiSpy;
    beforeEach(() => {
      service = TestBed.get(DocumentService);
      apiSpy = TestBed.get(ApiService);
    });

    describe('when no documents are returned by the api', () => {
      it('returns an empty Document array', async(() => {
        apiSpy.getDocumentsByAppId.and.returnValue(
          Observable.of({ text: () => {} })
        );
        service.getAllByApplicationId('123').subscribe(res => {
          expect(res).toEqual([] as Document[]);
        });
      }));
    });

    describe('when one document is returned by the api', () => {
      it('returns an array with one Document element', async(() => {
        apiSpy.getDocumentsByAppId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [new Document({ _id: 1 })]
          })
        );
        service.getAllByApplicationId('123').subscribe(res => {
          expect(res).toEqual([new Document({ _id: 1 })]);
        });
      }));
    });

    describe('when multiple documents are returned by the api', () => {
      it('returns an array with multiple Document elements', async(() => {
        apiSpy.getDocumentsByAppId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [
              new Document({ _id: 1 }),
              new Document({ _id: 2 }),
              new Document({ _id: 3 })
            ]
          })
        );
        service.getAllByApplicationId('123').subscribe(res => {
          expect(res).toEqual([
            new Document({ _id: 1 }),
            new Document({ _id: 2 }),
            new Document({ _id: 3 })
          ]);
        });
      }));
    });

    describe('when an exception is thrown', () => {
      it('ApiService.handleError is called and the error is re-thrown', async(() => {
        apiSpy.getDocumentsByAppId.and.returnValue(
          Observable.throw(Error('someError'))
        );

        apiSpy.handleError.and.callFake(error => {
          expect(error).toEqual(Error('someError'));
          return Observable.throw(Error('someRethrownError'));
        });

        service.getAllByApplicationId('123').subscribe(
          () => {
            fail('An error was expected.');
          },
          err => {
            expect(err).toEqual(Error('someRethrownError'));
          }
        );
      }));
    });
  });

  describe('getAllByCommentId', () => {
    let service: DocumentService;
    let apiSpy;
    beforeEach(() => {
      service = TestBed.get(DocumentService);
      apiSpy = TestBed.get(ApiService);
    });

    describe('when no documents are returned by the api', () => {
      it('returns an empty Document array', async(() => {
        apiSpy.getDocumentsByCommentId.and.returnValue(
          Observable.of({ text: () => {} })
        );
        service.getAllByCommentId('234').subscribe(res => {
          expect(res).toEqual([] as Document[]);
        });
      }));
    });

    describe('when one document is returned by the api', () => {
      it('returns an array with one Document element', async(() => {
        apiSpy.getDocumentsByCommentId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [new Document({ _id: 4 })]
          })
        );
        service.getAllByCommentId('234').subscribe(res => {
          expect(res).toEqual([new Document({ _id: 4 })]);
        });
      }));
    });

    describe('when multiple documents are returned by the api', () => {
      it('returns an array with multiple Document elements', async(() => {
        apiSpy.getDocumentsByCommentId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [
              new Document({ _id: 4 }),
              new Document({ _id: 5 }),
              new Document({ _id: 6 })
            ]
          })
        );
        service.getAllByCommentId('234').subscribe(res => {
          expect(res).toEqual([
            new Document({ _id: 4 }),
            new Document({ _id: 5 }),
            new Document({ _id: 6 })
          ]);
        });
      }));
    });

    describe('when an exception is thrown', () => {
      it('ApiService.handleError is called and the error is re-thrown', async(() => {
        apiSpy.getDocumentsByCommentId.and.returnValue(
          Observable.throw(Error('someError'))
        );

        apiSpy.handleError.and.callFake(error => {
          expect(error).toEqual(Error('someError'));
          return Observable.throw(Error('someRethrownError'));
        });

        service.getAllByCommentId('234').subscribe(
          () => {
            fail('An error was expected.');
          },
          err => {
            expect(err).toEqual(Error('someRethrownError'));
          }
        );
      }));
    });
  });

  describe('getAllByDecisionId', () => {
    let service: DocumentService;
    let apiSpy;
    beforeEach(() => {
      service = TestBed.get(DocumentService);
      apiSpy = TestBed.get(ApiService);
    });

    describe('when no documents are returned by the api', () => {
      it('returns an empty Document array', async(() => {
        apiSpy.getDocumentsByDecisionId.and.returnValue(
          Observable.of({ text: () => {} })
        );
        service.getAllByDecisionId('345').subscribe(res => {
          expect(res).toEqual([] as Document[]);
        });
      }));
    });

    describe('when one document is returned by the api', () => {
      it('returns an array with one Document element', async(() => {
        apiSpy.getDocumentsByDecisionId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [new Document({ _id: 7 })]
          })
        );
        service.getAllByDecisionId('345').subscribe(res => {
          expect(res).toEqual([new Document({ _id: 7 })]);
        });
      }));
    });

    describe('when multiple documents are returned by the api', () => {
      it('returns an array with multiple Document elements', async(() => {
        apiSpy.getDocumentsByDecisionId.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => [
              new Document({ _id: 7 }),
              new Document({ _id: 8 }),
              new Document({ _id: 9 })
            ]
          })
        );
        service.getAllByDecisionId('345').subscribe(res => {
          expect(res).toEqual([
            new Document({ _id: 7 }),
            new Document({ _id: 8 }),
            new Document({ _id: 9 })
          ]);
        });
      }));
    });

    describe('when an exception is thrown', () => {
      it('ApiService.handleError is called and the error is re-thrown', async(() => {
        apiSpy.getDocumentsByDecisionId.and.returnValue(
          Observable.throw(Error('someError'))
        );

        apiSpy.handleError.and.callFake(error => {
          expect(error).toEqual(Error('someError'));
          return Observable.throw(Error('someRethrownError'));
        });

        service.getAllByDecisionId('345').subscribe(
          () => {
            fail('An error was expected.');
          },
          err => {
            expect(err).toEqual(Error('someRethrownError'));
          }
        );
      }));
    });
  });

  describe('getById', () => {
    let service: DocumentService;
    let apiSpy;
    beforeEach(() => {
      service = TestBed.get(DocumentService);
      apiSpy = TestBed.get(ApiService);
    });

    describe('when forceReload is set to true', () => {
      describe('when no document is returned by the Api', () => {
        it('returns a null Document', async(() => {
          apiSpy.getDocument.and.returnValue(Observable.of({ text: () => {} }));

          service
            .getById('1', true)
            .subscribe(result => expect(result).toEqual(null as Document));
        }));
      });

      describe('when one document is returned by the Api', () => {
        it('returns one Document', async(() => {
          apiSpy.getDocument.and.returnValue(
            Observable.of({ text: () => 'notNull', json: () => [{ _id: '1' }] })
          );

          service
            .getById('1', true)
            .subscribe(result =>
              expect(result).toEqual(new Document({ _id: '1' }))
            );
        }));
      });

      describe('when multiple documents are returned by the Api', () => {
        it('returns only the first Document', async(() => {
          apiSpy.getDocument.and.returnValue(
            Observable.of({
              text: () => 'notNull',
              json: () => [{ _id: '1' }, { _id: '2' }, { _id: '3' }]
            })
          );

          service
            .getById('1', true)
            .subscribe(result =>
              expect(result).toEqual(new Document({ _id: '1' }))
            );
        }));
      });
    });

    describe('when forceReload is set to false', () => {
      describe('when a document is cached', () => {
        beforeEach(async(() => {
          apiSpy.getDocument.and.returnValues(
            Observable.of({
              text: () => 'notNull',
              json: () => [{ _id: '1' }]
            }),
            Observable.throw(
              Error(
                'Was not expecting ApiService.getDocument to be called more than once.'
              )
            )
          );

          // call once to set the cache
          service.getById('1', true).subscribe();
        }));

        it('returns the cached document', async(() => {
          // assert cached document is returned
          service
            .getById('1')
            .subscribe(result =>
              expect(result).toEqual(new Document({ _id: '1' }))
            );
        }));
      });

      describe('when no document is cached', () => {
        it('calls the api to fetch a document', async(() => {
          apiSpy.getDocument.and.returnValue(
            Observable.of({ text: () => 'notNull', json: () => [{ _id: '3' }] })
          );

          service
            .getById('1')
            .subscribe(result =>
              expect(result).toEqual(new Document({ _id: '3' }))
            );
        }));
      });
    });

    describe('when an exception is thrown', () => {
      it('ApiService.handleError is called and the error is re-thrown', async(() => {
        apiSpy.getDocument.and.returnValue(
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

        service.getById('1').subscribe(
          () => {
            fail('An error was expected.');
          },
          err => {
            expect(err).toEqual(Error('someRethrownError'));
          }
        );
      }));
    });
  });

  describe('add', () => {
    let service: DocumentService;
    let apiSpy;
    beforeEach(() => {
      service = TestBed.get(DocumentService);
      apiSpy = TestBed.get(ApiService);
    });

    describe('when no document is returned by the api', () => {
      it('returns null', async(() => {
        apiSpy.uploadDocument.and.returnValue(
          Observable.of({ text: () => {} })
        );

        service
          .add(new FormData())
          .subscribe(result => expect(result).toEqual(null as Document));
      }));
    });

    describe('when an empty document is returned by the api', () => {
      it('returns the empty document', async(() => {
        const document = new Document();

        apiSpy.uploadDocument.and.returnValue(
          Observable.of({
            text: () => 'notNull',
            json: () => document
          })
        );

        service.add(new FormData()).subscribe(result => {
          expect(result).toEqual(document);
        });
      }));
    });

    describe('when the document contains all required fields', () => {
      it('calls uploadDocument and returns a Document', async(() => {
        const formData = new FormData();
        formData.append('name', 'TestData');

        let formDataReceived;
        apiSpy.uploadDocument.and.callFake((arg: FormData) => {
          formDataReceived = arg;
          return Observable.of({
            text: () => 'notNull',
            json: () => new Document({ _id: '99' })
          });
        });

        service.add(formData).subscribe(result => {
          expect(result).toEqual(new Document({ _id: '99' }));

          expect(formDataReceived).toEqual(formData);
          expect(formDataReceived.get('name')).toEqual('TestData');
        });
      }));
    });

    describe('when an exception is thrown', () => {
      it('ApiService.handleError is called and the error is re-thrown', async(() => {
        apiSpy.uploadDocument.and.returnValue(
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

        service.add(new FormData()).subscribe(
          () => {
            fail('An error was expected.');
          },
          err => {
            expect(err).toEqual(Error('someRethrownError'));
          }
        );
      }));
    });
  });
});
