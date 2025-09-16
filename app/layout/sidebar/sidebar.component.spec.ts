import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { SidebarComponent } from './sidebar.component';
import { SubmissionService } from '../../core/services/submission.service';
import { AuthService } from '../../core/services/auth.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockSubmissionService: jasmine.SpyObj<SubmissionService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const submissionServiceSpy = jasmine.createSpyObj('SubmissionService', ['getChatHistory', 'getSubmissions']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of(null)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: SubmissionService, useValue: submissionServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    mockSubmissionService = TestBed.inject(SubmissionService) as jasmine.SpyObj<SubmissionService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockSubmissionService.getChatHistory.and.returnValue(of({ chatHistory: [] }));
    mockSubmissionService.getSubmissions.and.returnValue(of({ watchlist: [], dueToday: [], needsReview: [] }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load chat history and submissions on init', () => {
    expect(mockSubmissionService.getChatHistory).toHaveBeenCalled();
    expect(mockSubmissionService.getSubmissions).toHaveBeenCalled();
  });
});