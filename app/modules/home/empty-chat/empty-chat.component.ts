import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatInterfaceComponent } from '../../../shared/chat-interface/chat-interface.component';
import { Subject, switchMap, take, takeUntil } from 'rxjs';
import { Common } from '../../../shared/common/common.service';
import { SubmissionService } from '../../../core/services/submission.service';

@Component({
  selector: 'app-empty-chat',
  standalone: true,
  imports: [CommonModule, ChatInterfaceComponent],
  templateUrl: './empty-chat.component.html',
  styleUrl: './empty-chat.component.scss'
})
export class EmptyChatComponent {
  constructor(private router: Router,
    private ngZone: NgZone, private commonService: Common, private submissionService: SubmissionService) { }

  isLoading = false;

  chatHistory: any[] = [];

  private destroy$ = new Subject<void>();
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
        },
        complete: () => {
          this.loadAllChatHistory();
        }
      });

  }



  chatMessages: any[] = [];
  onSendMessage(message: string): void {
    // Add user message
    const userMessage: any = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);

    // Simulate bot response
    const botMessage: any = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: 'Thank you for your message. I\'m processing your request...',
      timestamp: new Date()
    };
    this.chatMessages.push(botMessage);

    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollToBottom();
    });
  }


  @ViewChild('chatMessage') private chatMessagesContainer!: ElementRef<HTMLDivElement>;

  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop =
        this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }


  allChatHistory: any[] = [];
  private loadAllChatHistory(): void {
    this.submissionService.getChatHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.chats) {
            this.allChatHistory = response.chats.map((chat: any) => ({
              id: chat._id,
              title: chat.title,
              date: chat.updated_date || chat.created_date,
              submissionId: chat._id // no submissionId in backend, so fallback to _id
            }));
          } else {
            this.allChatHistory = [];
          }
        },
        error: (error) => {
          console.error('Error loading chat history:', error);
          this.allChatHistory = [];
        }
      });
  }

  onOpenChatHistory(): void {
    this.commonService.emitOpenSidebar();
  }

}