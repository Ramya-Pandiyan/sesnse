import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { SubmissionService } from '../../../core/services/submission.service';
import { ChatInterfaceComponent } from '../../../shared/chat-interface/chat-interface.component';
import { ChatMessage } from '../../../data/model/submission.model';
import { RightSidebarComponent } from '../../../shared/right-sidebar/right-sidebar.component';
import { EmailPreviewModalComponent } from '../../../shared/email-preview-modal/email-preview-modal.component';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-underwriting-dashboard',
  standalone: true,
  imports: [CommonModule, ChatInterfaceComponent, RightSidebarComponent, EmailPreviewModalComponent],
  templateUrl: './underwriting-dashboard.component.html',
  styleUrl: './underwriting-dashboard.component.scss'
})
export class UnderwritingDashboardComponent implements OnInit, OnDestroy {
  chatMessages: any[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();
  showRightSidebar: boolean = true;
  constructor(
    private submissionService: SubmissionService,
    private router: Router,
    private ngZone: NgZone,

    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    // this.loadInitialChatMessages();
    this.loadDashboardData();
  }


  showEmailModal = false;

  //  isEmailPanelOpen = false;
  submissionId = '';
  closeEmailPanel(): void {
    this.isEmailPanelOpen = false;
  }


  onEmailModalClose(): void {
    this.showEmailModal = false;
  }

  onEmailSent(): void {
    this.showEmailModal = false;
    this.notificationService.showSuccess('Information request sent successfully to broker');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) this.observer.disconnect(); this.destroy$.next();
    this.destroy$.complete();
  }

  private observer!: MutationObserver;

  ngAfterViewInit(): void {
    this.observer = new MutationObserver(() => this.scrollToBottom());
    this.observer.observe(this.chatMessagesContainer.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  chatArea = document.getElementById('chat-area');

  scroll() {
    if (this.chatArea) {
      this.chatArea.scrollTop = this.chatArea.scrollHeight;
    }
  }

  chatId = '68c05bd77d59c0e91d6816c4';

  private streamBotReply(chatId: string, userContent: string, botMsg: any): void {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/conversations/${chatId}/messages`;

    const token = localStorage.getItem('token');

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: { content: userContent } })
    })
      .then(response => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const pump = (): any =>
          reader!.read().then(({ done, value }) => {
            if (done) return;

            const chunk = decoder.decode(value, { stream: true });

            // Split by new lines (SSE events are line-delimited)
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

            for (const line of lines) {
              const data = line.replace(/^data:\s*/, '');

              if (data === '[DONE]') {
                console.log('Stream complete');
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed?.content) {
                  botMsg.content += parsed.content;
                  this.ngZone.run(() => { }); // update Angular UI
                }
              } catch (err) {
                console.warn('Non-JSON SSE data:', data);
              }
            }

            return pump();
          });

        return pump();
      })
      .catch(err => {
        console.error('Streaming error:', err);
        botMsg.content += '\n[Error receiving response]';
      });
  }

  goBack() {
    this.router.navigate(['/home/']);
  }

  dashboardData: any;

  private loadDashboardData(): void {
    this.dashboardData = {
      submissions: {
        new: 10,
        highPriority: 2,
        needInfo: 2
      },
      watchlist: [
        {
          company: 'ABC Corporation',
          details: 'You have received 2 additional years of loss run data and more details on target sub-limits which you had requested'
        },
        {
          company: 'XYZ Condominium Association',
          details: 'Broker mentioned that acceptable premium is $200,000 against your quote of $225,000'
        }
      ]
    };
  }

  @ViewChild('chatMessage') private chatMessagesContainer!: ElementRef<HTMLDivElement>;

  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop =
        this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
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


  copiedMessageId: string | null = null;

  onCopyClick(message: any): void {
    navigator.clipboard.writeText(message.content).then(() => {
      this.copiedMessageId = message.id;

      setTimeout(() => {
        this.copiedMessageId = null;
      }, 2000);
    });
  }

  // Component properties
  latestActionResponse: any = null;
  isEmailPanelOpen = false;
  emailDraft: { to?: string; subject?: string; body?: string } | null = null;

  // -----------------------------------------------------------------------------
  // Utility: safe JSON parse (tries normal JSON.parse, then a single-quote -> double-quote fallback)
  private safeJsonParse(str: any): any {
    if (str === null || str === undefined) return null;
    if (typeof str !== 'string') return str;

    const s = str.trim();

    // Already valid JSON?
    try {
      return JSON.parse(s);
    } catch { }

    // Fallback: try converting Python-style / single-quoted JSON to valid JSON
    try {
      let fixed = s;

      // Replace Python-style True/False/None if they sneak in
      fixed = fixed.replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false');

      // Replace outer single quotes with double quotes
      // careful: we don’t want to destroy things like "Lloyd's"
      // Strategy: replace only the quotes around keys and JSON strings
      fixed = fixed.replace(/'([^']*?)'\s*:/g, (_, key) => `"${key}":`); // keys
      fixed = fixed.replace(/:\s*'([^']*?)'/g, (_, val) => `:"${val}"`); // values

      return JSON.parse(fixed);
    } catch (err) {
      console.warn('Failed to parse content as JSON-like:', s, err);
      return null;
    }
  }


  // -----------------------------------------------------------------------------
  // Parse the bot content into an array of items: [{ content: string, actions?: string[] }, ...]
  private parseBotContent(rawContent: any): Array<{ content: string; actions?: string[] }> {
    if (rawContent === null || rawContent === undefined) return [];

    // If it's already an object/array (not a string)
    if (typeof rawContent !== 'string') {
      if (Array.isArray(rawContent)) {
        return rawContent.map(it => ({ content: (it?.content ?? JSON.stringify(it)), actions: it?.actions ?? [] }));
      }
      // object
      if (rawContent?.content || rawContent?.actions) {
        return [{ content: rawContent.content ?? JSON.stringify(rawContent), actions: rawContent.actions ?? [] }];
      }
      // fallback to stringify
      return [{ content: JSON.stringify(rawContent) }];
    }

    // rawContent is a string
    // 1) Try to parse it (normal JSON or fallback)
    const parsed = this.safeJsonParse(rawContent);

    if (Array.isArray(parsed)) {
      return parsed.map(it => ({ content: it?.content ?? JSON.stringify(it), actions: it?.actions ?? [] }));
    }

    if (parsed && typeof parsed === 'object' && (parsed.content || parsed.actions)) {
      return [{ content: parsed.content ?? JSON.stringify(parsed), actions: parsed.actions ?? [] }];
    }

    // Not parseable as the array/object format we expect -> return as single plain item.
    return [{ content: rawContent }];
  }

  // -----------------------------------------------------------------------------
  // convertMarkdownTables: unchanged behaviour but tolerance for already-HTML content
  convertMarkdownTables(content: string): string {
    if (!content) return '';

    // If server already returned HTML (e.g. starts with <), return as-is
    const trimmed = content.trim();
    if (trimmed.startsWith('<')) {
      return content;
    }

    const lines = content.trim().split('\n');
    let html = '';
    let insideTable = false;
    let tableLines: string[] = [];

    const flushTable = () => {
      if (tableLines.length < 2) return;

      // Get headers and add new "Action" column
      let tableHtml = '<table><thead><tr>';
      const headers = tableLines[0].split('|').filter(Boolean).map(h => h.trim());
      headers.forEach(h => tableHtml += `<th>${this.escapeHtml(h)}</th>`);
      tableHtml += `<th>Action</th>`; // new column header
      tableHtml += '</tr></thead><tbody>';

      for (let i = 2; i < tableLines.length; i++) {
        const cols = tableLines[i].split('|').filter(Boolean).map(c => c.trim());
        tableHtml += '<tr>';
        cols.forEach(c => tableHtml += `<td>${this.escapeHtml(c)}</td>`);
        tableHtml += `<td><button class="view-btn" onclick="handleViewClick(this)" style="color: blue !important;">View</button></td>`; // clickable button
        tableHtml += '</tr>';
      }

      tableHtml += '</tbody></table>';
      html += tableHtml;
      tableLines = [];
    };

    for (const line of lines) {
      if (line.startsWith('|')) {
        insideTable = true;
        tableLines.push(line);
      } else {
        if (insideTable) {
          flushTable();
          insideTable = false;
        }
        // Keep paragraphs, escaping HTML entities
        html += `<p>${this.escapeHtml(line)}</p>`;
      }
    }

    if (insideTable) flushTable();

    return html;
  }

  // small helper to escape HTML content (prevents accidental injection)
  private escapeHtml(text: string): string {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // -----------------------------------------------------------------------------
  // Generic sendMessage (typed messages or card sends). showUserBubble defaults to true
  sendMessage(display: string, api?: string, showUserBubble: boolean = true): void {
    if (!display?.trim()) return;

    const messageToSend = api || display;

    // only show the user bubble if caller requested it
    if (showUserBubble) {
      this.chatMessages.push({
        id: `user-${Date.now()}`,
        type: 'user',
        content: display,
        timestamp: new Date()
      });
    }

    this.isLoading = true;
    if (!this.chatId) {
      this.isLoading = false;
      return;
    }

    this.submissionService.sendMessage(this.chatId, messageToSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let parsed;

          try {
            // Try to parse structured content (the array case)
            parsed = JSON.parse(response?.content?.replace(/'/g, '"'));
          } catch {
            parsed = null;
          }

          if (Array.isArray(parsed)) {
            // Multiple bot messages, each with actions
            parsed.forEach((item: any) => {
              const htmlContent = this.convertMarkdownTables(item.content || '');
              this.chatMessages.push({
                id: `bot-${Date.now()}-${Math.random()}`,
                type: 'bot',
                content: htmlContent,
                actions: item.actions || [],
                timestamp: new Date()
              });
            });
          } else {
            // Fallback: plain string response
            const htmlContent = this.convertMarkdownTables(response?.content || '');
            this.chatMessages.push({
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: htmlContent,
              actions: [], // no actions
              timestamp: new Date()
            });
          }
        }
        ,
        error: (error) => {
          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: this.escapeHtml(error?.message || '⚠️ Failed to send message.'),
            timestamp: new Date()
          });
          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  // -----------------------------------------------------------------------------
  // Called when a card is clicked (keeps user bubble, like a typed message)
  sendCardMessage(display: string, api: string): void {
    this.sendMessage(display, api, true);
  }

  // -----------------------------------------------------------------------------
  // Called when user types manually (shows user bubble)
  onSendCardMessage(userText: string): void {
    this.sendMessage(userText, undefined, true);
  }

  // -----------------------------------------------------------------------------
  // ACTION button flow: call API, DO NOT create a user bubble, store response and process it
  sendActionMessage(action: any): void {
    if (!action) return;

    // Extract proper display + API message
    const displayText = typeof action === 'string' ? action : action.label || '';
    const apiMessage = typeof action === 'string' ? action : action.action || '';

    // 1. Always push user bubble first
    if (displayText?.trim()) {
      this.chatMessages.push({
        id: `user-${Date.now()}`,
        type: 'user',
        content: displayText,
        timestamp: new Date()
      });
    }

    // 2. If this is the preview action, just open the email panel
    if (apiMessage === 'previewMail') {
      this.isEmailPanelOpen = true;
      return;
    }

    // 3. Otherwise, treat it like a normal API call
    if (!apiMessage?.trim()) return;

    this.isLoading = true;
    if (!this.chatId) {
      this.isLoading = false;
      return;
    }

    this.submissionService.sendMessage(this.chatId, apiMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let parsed;

          try {
            parsed = JSON.parse(response?.content?.replace(/'/g, '"'));
          } catch {
            parsed = null;
          }

          const messages = Array.isArray(parsed) ? parsed : [{ content: response?.content }];

          messages.forEach((item: any) => {
            const htmlContent = this.convertMarkdownTables(item.content || '');
            const newMessage: any = {
              id: `bot-${Date.now()}-${Math.random()}`,
              type: 'bot',
              content: htmlContent,
              actions: item.actions ? [...item.actions] : [],
              timestamp: new Date()
            };

            // Special: add previewMail action if detected
            if ((item.content || '').toLowerCase().includes("would you like to preview it?")) {
              if (response?.metadata) {
                this.emailDraft = {
                  to: response.metadata.to,
                  subject: response.metadata.subject,
                  body: response.metadata.body
                };
              }
              if (!newMessage.actions) newMessage.actions = [];
              if (!newMessage.actions.find((a: any) => a.action === 'previewMail')) {
                newMessage.actions.push({ label: "✅ Yes, preview it", action: "previewMail" });
              }
            }

            this.chatMessages.push(newMessage);
          });

          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
        },
        error: (error) => {
          console.error('Action API failed:', error);
          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: this.escapeHtml(error?.message || '⚠️ Action failed.'),
            timestamp: new Date()
          });
          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  // new logic

  sendCardMessage1(display: string, api: string): void {
    this.sendMessage1(display, api, true);
  }

  onSendManualMessage1(userText: string): void {
    this.sendMessage1(userText, undefined, true);
  }

  sendMessage1(display: string, api?: string, showUserBubble: boolean = true) {
    this.isLoading = true;
    if (!display?.trim()) return;

    const messageToSend = api || display;

    // only show the user bubble if caller requested it
    if (showUserBubble) {
      this.chatMessages.push({
        id: `user-${Date.now()}`,
        type: 'user',
        content: display,
        timestamp: new Date()
      });
    }

    this.isLoading = true;
    if (!this.chatId) {
      this.isLoading = false;
      return;
    }

    this.submissionService.sendMessage(this.chatId, messageToSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Got response from backend:', response); // <-- new

          try {
            console.log('response:', response);
            const content = response?.content;

            // Single or array of messages
            const messages = Array.isArray(content) ? content : [{ content }];

            messages.forEach((item: any) => {

              console.log('item.content:', item.content);

              const htmlContent = this.convertMarkdownTables(item.content || '');
              const newMessage: any = {
                id: `bot-${Date.now()}-${Math.random()}`,
                type: 'bot',
                content: htmlContent,
                actions: item.actions ? [...item.actions] : [],
                timestamp: new Date()
              };

              // --- Add email preview if content matches ---
              if ((item.content || '').toLowerCase().includes("would you like to preview it?")) {
                console.log('Email preview triggered');

                if (response?.metadata) {
                  this.emailDraft = {
                    to: response.metadata.to,
                    subject: response.metadata.subject,
                    body: response.metadata.body
                  };
                }

                // Ensure actions array exists
                if (!newMessage.actions) newMessage.actions = [];

                // Only push if not already present
                if (!newMessage.actions.find((a: any) => a.action === 'previewMail')) {
                  newMessage.actions.push({ label: "✅ Yes, preview it", action: "previewMail" });
                  console.log('Preview action added', newMessage.actions);
                }
              }
              this.chatMessages.push(newMessage);
            });

            this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());

          } catch (err) {
            console.error('Failed to handle response:', err);
          }
        },

        error: (error) => {
          console.log('SendMessage error:', error); // <-- new

          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: this.escapeHtml(error?.message || '⚠️ Failed to send message.'),
            timestamp: new Date()
          });
          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
        },
        complete: () => {
          console.log('dwf error:'); // <-- new

          this.isLoading = false;
        }
      })
  }

  openSubmission() {
    this.router.navigate(['/home/underwriting/submission', 'SUB-69069']);

  }

  // Example handler inside your component
  handleViewClick(button: HTMLElement) {
    const row = button.closest('tr');
    console.log('View clicked for row:', row);
  }

}