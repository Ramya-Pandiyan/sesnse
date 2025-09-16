import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../modal/modal.component';
import { EmailInboxPanelComponent } from '../email-inbox/email-inbox.component';
import { SubmissionService, Submission } from '../../core/services/submission.service';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, ModalComponent, EmailInboxPanelComponent],
  templateUrl: './right-sidebar.component.html',
  styleUrl: './right-sidebar.component.scss'
})
export class RightSidebarComponent implements OnInit, OnDestroy {
  submissions: any = {};
  activeTab = 'needs-review';
  topActiveTab = 'watchlist'
  private destroy$ = new Subject<void>();
  isMailInboxOpen: boolean = false;
  constructor(
    private submissionService: SubmissionService,
    private router: Router
  ) { }
  intervalId: any;

  ngOnInit(): void {
    console.log('initialized right sidebar component');
    this.loadSubmissions();

    // this.intervalId = setInterval(() => {
    //   this.loadSubmissions();
    // }, 2000); // every 2 seconds
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSubmissions(): void {
    this.submissionService.getSubmissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submissions = response;
        },
        error: (error) => {
          console.error('Error loading submissions:', error);
        }
      });
  }

  onSubmissionClick(submission: Submission): void {
    this.router.navigate(['/home/underwriting/submission', submission.id]);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setTopActiveTab(tab: string): void {
    this.topActiveTab = tab;
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  mails: any = [];
  mail_metadata = [];
  showModal = false;
  onMailClick(): void {
    this.submissionService.getMails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.mails = response?.mails || [];
          this.mail_metadata = this.mails[0]?.mail_metadata;

          console.log(this.mails)
          // this.showModal = true;

          this.isMailInboxOpen = true;
        },
        error: (error) => {
          console.error('Error loading mails:', error);
        }
      });
  }

  onMailCardClick(mail: any) {
    console.log('Clicked mail:', mail);
    // You can route, open another modal, etc.
    this.isMailInboxOpen = true;
  }
}