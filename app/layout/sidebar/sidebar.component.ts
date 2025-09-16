import { Component, OnInit, OnDestroy, EventEmitter, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SubmissionService } from '../../core/services/submission.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../data/model/user.model';
import { Common } from '../../shared/common/common.service';
import { EmailWorkflowComponent } from '../../shared/email-notification/email-notification.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ModalComponent,EmailWorkflowComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSubSidebarOpen = false;
  currentUser: User | null = null;
  chatHistory: any[] = [];
   @Output() underwritingClicked = new EventEmitter<void>();
   showModal = false;
   private destroy$ = new Subject<void>();
    isPinned = false;

  constructor(
    private submissionService: SubmissionService,
    private authService: AuthService,
    private router: Router,
    private commonService: Common
  ) {}

  showNotificationIcon: boolean = true;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadChatHistory();


   this.commonService.sidebarOpen$
  .pipe(takeUntil(this.destroy$))
  .subscribe(() => {
    this.forceOpenSubSidebar();
  });

  this.commonService.hasSocketData$.subscribe(flag => {
    console.log('Has socket data:', flag);
    this.showNotificationIcon =flag;
  });

  }

manualOpen = false; 

openSubSidebar() {
  if (!this.manualOpen) {
    this.isSubSidebarOpen = true;
  }
}

closeSubSidebar() {
  if (!this.manualOpen && !this.isPinned) {
    this.isSubSidebarOpen = false;
  }
}

forceOpenSubSidebar() {
  this.manualOpen = true;
  this.isSubSidebarOpen = true;
}

releaseManualOpen() {
  this.manualOpen = false;
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

private loadChatHistory(): void {
  this.submissionService.getChatHistory()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response && response.chats) {
          this.chatHistory = response.chats.map((chat: any) => ({
            id: chat._id,
            title: chat.title,
            date: chat.updated_date || chat.created_date,
            submissionId: chat._id // no submissionId in backend, so fallback to _id
          }));
        } else {
          this.chatHistory = [];
        }
      },
      error: (error) => {
        console.error('Error loading chat history:', error);
        this.chatHistory = [];
      }
    });
}


  onHomeHover(): void {
    this.isSubSidebarOpen = !this.isSubSidebarOpen;
  }

  toggleSubSidebar(): void {
    this.isSubSidebarOpen = !this.isSubSidebarOpen;
  }

  onSubSidebarMouseEnter(): void {
    this.isSubSidebarOpen = true;
  }

  onSubSidebarMouseLeave(): void {
    this.isSubSidebarOpen = false;
  }

  onUnderwritingClick(): void {
    this.underwritingClicked.emit();
    this.commonService.emitUnderwritingClicked();
    this.router.navigate(['/home/underwriting/dashboard']);
  }

onNewChatClick(): void {
  const newChat = { title: 'New Chat' };

  this.submissionService.createChat(newChat)
    .pipe(
      takeUntil(this.destroy$),
      switchMap((createResponse) => {
        const chatId = createResponse?.chat?._id;
        if (!chatId) {
          throw new Error('Chat ID not returned from API');
        }
        // Navigate right away to the new chat
        this.router.navigate(['/home/chat', chatId]);
        // Still refresh chat history after navigating
        return this.submissionService.getChatHistory();
      })
    )
    .subscribe({
      next: (response) => {
        if (response && response.chats) {
          this.chatHistory = response.chats.map((chat: any) => ({
            id: chat._id,
            title: chat.title,
            date: chat.updated_date || chat.created_date,
            submissionId: chat._id
          }));
        } else {
          this.chatHistory = [];
        }
      },
      error: (error) => {
        console.error('Error creating new chat or loading history:', error);
      }
    });
}


  onChatHistoryClick(chat: any): void {
    this.router.navigate(['/home/chat', chat.id]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }


  togglePin(): void {
    this.isPinned = !this.isPinned;
    // If pinning, ensure sidebar is open
    if (this.isPinned) {
      this.isSubSidebarOpen = true;
    }
  }

toggleMenu(chat: any, event: MouseEvent): void {
  event.stopPropagation();
  this.chatHistory.forEach(c => c.showMenu = false);
   chat.showMenu = true;
}

onDeleteChat(chat: any): void {
  this.submissionService.deleteChat(chat.id)
    .pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.submissionService.getChatHistory())
    )
    .subscribe({
      next: (response) => {
        this.chatHistory = response?.chats?.map((c: any) => ({
          id: c._id,
          title: c.title,
          date: c.updated_date || c.created_date,
          submissionId: c._id
        })) || [];
      },
      error: (error) => {
        console.error('Error deleting chat:', error);
      }
    });

    chat.showMenu = false;
}

onShareChat(chat: any): void {
  // placeholder: copy link, or open share dialog
  console.log('Sharing chat:', chat);
  chat.showMenu = false;
}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // only close if the click is NOT inside a menu or button
    if (!target.closest('.chat-menu')) {
      this.chatHistory.forEach(c => c.showMenu = false);
    }
  }

}