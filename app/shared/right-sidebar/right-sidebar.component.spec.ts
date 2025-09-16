import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { RightSidebarComponent } from './right-sidebar.component';
import { SubmissionService } from '../../core/services/submission.service';

describe('RightSidebarComponent', () => {
  let component: RightSidebarComponent;
  let fixture: ComponentFixture<RightSidebarComponent>;
  let mockSubmissionService: jasmine.SpyObj<SubmissionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const submissionServiceSpy = jasmine.createSpyObj('SubmissionService', ['getSubmissions']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RightSidebarComponent],
      providers: [
        { provide: SubmissionService, useValue: submissionServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RightSidebarComponent);
    component = fixture.componentInstance;
    mockSubmissionService = TestBed.inject(SubmissionService) as jasmine.SpyObj<SubmissionService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockSubmissionService.getSubmissions.and.returnValue(of({ watchlist: [], dueToday: [], needsReview: [] }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load submissions on init', () => {
    expect(mockSubmissionService.getSubmissions).toHaveBeenCalled();
  });
});