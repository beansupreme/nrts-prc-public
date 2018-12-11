import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCommentComponent } from './add-comment.component';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from 'app/file-upload/file-upload.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentService } from 'app/services/comment.service';
import { DocumentService } from 'app/services/document.service';

describe('AddCommentComponent', () => {
  let component: AddCommentComponent;
  let fixture: ComponentFixture<AddCommentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddCommentComponent,
        FileUploadComponent
      ],
      imports: [
        FormsModule
      ],
      providers: [
        NgbActiveModal,
        { provide: CommentService },
        { provide: DocumentService },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
