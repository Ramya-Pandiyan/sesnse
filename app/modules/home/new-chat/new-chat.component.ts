import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { SubmissionService } from '../../../core/services/submission.service';
import { ChatInterfaceComponent } from '../../../shared/chat-interface/chat-interface.component';
import { ChatMessage } from '../../../data/model/submission.model';
import { Common } from '../../../shared/common/common.service';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [CommonModule, ChatInterfaceComponent],
  templateUrl: './new-chat.component.html',
  styleUrl: './new-chat.component.scss'
})
export class NewChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  chatMessages: any[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();
  chatId: string = '';

  constructor(
    private submissionService: SubmissionService,
    private router: Router,
    private ngZone: NgZone,
    private commonService: Common
  ) {}

  ngOnInit(): void {
    this.router.routerState.root.firstChild?.params
      .pipe(take(1))
      .subscribe(params => {
        this.chatId = params['id'] || '';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @ViewChild('chatMessage') private chatMessagesContainer!: ElementRef<HTMLDivElement>;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop =
        this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  private loadInitialChatMessages(): void {
    this.isLoading = true;
    this.submissionService.getInitialChatMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chatMessages = [
  ];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading chat messages:', error);
          this.isLoading = false;
        }
      });
  }

  onActionClick(actionType: string): void {
    if (actionType === 'open-submission') {
      this.router.navigate(['/home/underwriting/submission', 'SUB-001']);
    }
  }

  onSendMessage(message: string): void {
  if (!message.trim()) return;

  // Push user message
  this.chatMessages.push({
    id: `user-${Date.now()}`,
    type: 'user',
    content: message,
    timestamp: new Date()
  });

  // Set loader flag
  this.isLoading = true;

  // Call API
  this.submissionService.sendMessage(this.chatId, message).subscribe({
    next: (response) => {
      // Push bot reply
      console.log('llll',response)
      this.chatMessages.push({
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response?.content || '⚠️ No response received.',
        timestamp: new Date()
      });
    },
    error: (error) => {
      // Push error message
      this.chatMessages.push({
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: error.message || '⚠️ Failed to send message.',
        timestamp: new Date()
      });
    },
    complete: () => {
      this.isLoading = false;
      this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
    }
  });
}


  goBack() {
     this.router.navigate(['/home/']);
  }

  
copiedMessageId: string | null = null;

onCopyClick(message: any): void {
  navigator.clipboard.writeText(message.content).then(() => {
    this.copiedMessageId = message.id;

    // hide after 2s
    setTimeout(() => {
      this.copiedMessageId = null;
    }, 2000);
  });
}

}