import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { EmailPreviewModalComponent } from './email-preview-modal.component';
import { SubmissionService } from '../../core/services/submission.service';

describe('EmailPreviewModalComponent', () => {
  let component: EmailPreviewModalComponent;
  let fixture: ComponentFixture<EmailPreviewModalComponent>;
  let mockSubmissionService: jasmine.SpyObj<SubmissionService>;

  beforeEach(async () => {
    const submissionServiceSpy = jasmine.createSpyObj('SubmissionService', ['getEmailDraft', 'sendEmailToBroker']);

    await TestBed.configureTestingModule({
      imports: [EmailPreviewModalComponent, FormsModule],
      providers: [
        { provide: SubmissionService, useValue: submissionServiceSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(EmailPreviewModalComponent);
    component = fixture.componentInstance;
    mockSubmissionService = TestBed.inject(SubmissionService) as jasmine.SpyObj<SubmissionService>;

    mockSubmissionService.getEmailDraft.and.returnValue(of({ draft: {} }));
    mockSubmissionService.sendEmailToBroker.and.returnValue(of({ success: true }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load email draft on init', () => {
    expect(mockSubmissionService.getEmailDraft).toHaveBeenCalled();
  });
});