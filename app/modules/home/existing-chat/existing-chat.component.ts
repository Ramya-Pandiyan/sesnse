import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { SubmissionService } from '../../../core/services/submission.service';
import { ChatInterfaceComponent } from '../../../shared/chat-interface/chat-interface.component';
import { ChatMessage } from '../../../data/model/submission.model';

@Component({
  selector: 'app-existing-chat',
  standalone: true,
  imports: [CommonModule, ChatInterfaceComponent],
  templateUrl: './existing-chat.component.html',
  styleUrl: './existing-chat.component.scss'
})
export class ExistingChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  chatMessages: any[] = [];
  isLoading = false;
  chatId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private submissionService: SubmissionService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.chatId = params['chatId'];
      this.loadChatHistory();
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
    } catch (err) { }
  }

  private loadChatHistory(): void {
    console.log('invokedd')
    this.isLoading = true;

    this.submissionService.getChatById(this.chatId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.messages) {
            this.chatMessages = response.messages.map((msg: any, index: number) => ({
              id: `${msg.role}-${index}`,   // generate id since backend doesn’t send one
              type: msg.role === 'user' ? 'user' : 'bot',
              content: msg.content,
              timestamp: new Date() // no timestamp in payload, so fallback to "now"
            }));
          } else {
            this.chatMessages = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching chat:', error);
          this.chatMessages = [];
          this.isLoading = false;
        }
      });
  }


  onActionClick(actionType: string): void {
    if (actionType === 'open-submission') {
      this.router.navigate(['/home/underwriting/submission', 'SUB-001']);
    }
  }

  onMessageSubmit(content: string): void {
    if (!this.chatId || !content.trim()) return;

    // 1. Show user bubble immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    this.chatMessages.push(userMsg);

    // 2. Show loader
    this.isLoading = true;

    // 3. Call API
    this.submissionService.sendMessage(this.chatId, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Push bot message after API returns
          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: response?.content || '⚠️ No response received.',
            timestamp: new Date()
          });
        },
        error: (error) => {
          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: error.message || '⚠️ Failed to send message.',
            timestamp: new Date()
          });
        },
        complete: () => {
          // Hide loader
          this.isLoading = false;

          // Scroll to bottom
          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
          this.loadAllChatHistory();
        }
      });
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



  /**
   * Stream bot reply token by token
   */
  // private streamBotReply(chatId: string, userContent: string, botMsg: any): void {
  //   const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/conversations/${chatId}/messages`;

  //   const token = localStorage.getItem('token'); 

  //   fetch(url, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${token}`
  //     },
  //     body: JSON.stringify({ message: { content: userContent } })
  //   })
  //     .then(response => {
  //       const reader = response.body?.getReader();
  //       const decoder = new TextDecoder();

  //       const pump = (): any =>
  //         reader!.read().then(({ done, value }) => {
  //           if (done) return;

  //           const chunk = decoder.decode(value, { stream: true });

  //           // Split by new lines (SSE events are line-delimited)
  //           const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

  //           for (const line of lines) {
  //             const data = line.replace(/^data:\s*/, '');

  //             if (data === '[DONE]') {
  //               console.log('Stream complete');
  //               return;
  //             }

  //             try {
  //               const parsed = JSON.parse(data);
  //               if (parsed?.content) {
  //                 botMsg.content += parsed.content;
  //                 this.ngZone.run(() => {}); // update Angular UI
  //               }
  //             } catch (err) {
  //               console.warn('Non-JSON SSE data:', data);
  //             }
  //           }

  //           return pump();
  //         });

  //       return pump();
  //     })
  //     .catch(err => {
  //       console.error('Streaming error:', err);
  //       botMsg.content += '\n[Error receiving response]';
  //     });
  // }

  onCopy(message: any): void {
    navigator.clipboard.writeText(message.content).then(() => {
      console.log('Copied:', message.content);
    });
  }

  onShare(message: any): void {
    if (navigator.share) {
      navigator.share({
        title: 'Chat Message',
        text: message.content
      }).catch(err => console.warn('Share failed', err));
    } else {
      console.log('Share not supported in this browser');
    }
  }

  onRetry(message: any): void {
    // retry bot response logic
    console.log('Retry clicked for message:', message);
    // You could re-trigger streamBotReply here if needed
  }

  onEdit(message: any): void {
    console.log('Edit clicked for message:', message);
    // you can populate the input box with old message for editing
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