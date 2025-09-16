import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RightPanelComponent } from '../right-panel/right-panel.component';
import { SubmissionService } from '../../core/services/submission.service';
import { EmailDraft } from '../../data/model/submission.model';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-email-preview-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RightPanelComponent],
  templateUrl: './email-preview-modal.component.html',
  styleUrls: ['./email-preview-modal.component.scss']
})
export class EmailPreviewModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() submissionId = '';
  @Output() close = new EventEmitter<void>();
  @Output() emailSent = new EventEmitter<void>();

  emailDraft: EmailDraft | null = null;
  isLoading = false;
  isSending = false;
  attachments: File[] = [];

  constructor(private submissionService: SubmissionService) {}

  private destroy$ = new Subject<void>();
  ngOnInit(): void {
    if (!this.isOpen) {
      this.openEmailPanel();
    }
  }

previewResponse: string | null = null;

    chatId = '68c05bd77d59c0e91d6816c4';

  openEmailPanel(): void {
    if (!this.chatId) return;
  
    const query = "Do you want to send an email to Broker asking for BOR and additional loss runs?";
  
    // show loader (optional)
    this.isLoading = true;
  
    this.submissionService.sendMessage(this.chatId, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
  this.previewResponse = response; // store the full response
  this.loadEmailDraftFromPreview(response);
},
error: (error) => {
  this.previewResponse = null;
  this.emailDraft = null;
  console.error(error);
},
complete: () => {
  this.isLoading = false;
}

      });
  }

private loadEmailDraftFromPreview(previewResponse: any): void {
  try {
    const meta = previewResponse?.metadata;
    if (!meta) throw new Error('No metadata found');

    this.emailDraft = {
      to: meta.to,
      subject: meta.subject,
      body: this.formatEmailBody(meta.body),
      submissionId: meta.submissionId || null
    };
  } catch (err) {
    console.error('Error loading draft:', err);
    this.emailDraft = null;
  }
}


private formatEmailBody(raw: string): string {
  if (!raw) return '';
  return raw
    .split(/\n\n+/)               // split paragraphs by two or more newlines
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`) // single line break -> <br>
    .join('');
}




  onClose(): void {
    this.close.emit();
  }

  formatText(command: string): void {
    document.execCommand(command, false, '');
  }

  isFormatActive(command: string): boolean {
    return document.queryCommandState(command);
  }

  onBodyChange(event: Event): void {
    if (this.emailDraft) {
      this.emailDraft.body = (event.target as HTMLElement).innerHTML;
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        this.attachments.push(input.files[i]);
      }
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSend(): void {
  if (this.emailDraft && !this.isSending) {
    this.isSending = true;

    const payload = {
      to: this.emailDraft.to,
      subject: this.emailDraft.subject,
      body: this.emailDraft.body
    };

    this.submissionService.sendEmailToBroker(this.submissionId, payload).subscribe({
      next: (response) => {
        this.emailSent.emit();
        this.isSending = false;
        this.onClose();
      },
      error: (error) => {
        console.error('Error sending email:', error);
        this.isSending = false;
      }
    });
  }
}

}