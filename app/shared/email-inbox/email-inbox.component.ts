import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RightPanelComponent } from '../right-panel/right-panel.component';
import { SubmissionService } from '../../core/services/submission.service';
import { takeUntil, Subject } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface EmailData {
  _id: string;
  email_id: string;
  mail_metadata: {
    subject: string;
    from_email_id: string;
    to_addresses: string[];
    cc_addresses: string[];
    mail_received_date: string;
    body: string;
    body_html: string; // Added body_html property
    attachments?: Array<{
      name: string;
      type: string;
      url: string;
    }>;
  };
  expanded?: boolean;
  status: string;
}

@Component({
  selector: 'app-email-inbox-panel',
  templateUrl: './email-inbox.component.html',
  styleUrl: './email-inbox.component.scss',
  standalone: true,
  imports: [CommonModule, RightPanelComponent]
})
export class EmailInboxPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  mails: EmailData[] = [];
  emailDraft: any[] = [];

  constructor(
    private submissionService: SubmissionService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadMails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMails(): void {
    this.submissionService.getMails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.mails = response?.mails || [];
          console.log('Loaded mails:', this.mails);
        },
        error: (error) => {
          console.error('Error loading mails:', error);
        }
      });
  }

  toggleExpand(mail: EmailData): void {
    mail.expanded = !mail.expanded;
  }

  onClose(): void {
    this.close.emit();
  }

  // Utility methods for template
  trackByEmailId(index: number, mail: EmailData): string {
    return mail.email_id;
  }

  getInitials(email: string): string {
    if (!email) return '?';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  }

  getSenderName(email: string): string {
    if (!email) return 'Unknown';
    const localPart = email.split('@')[0];
    return localPart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // If today, show time
    if (mailDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // If this week, show day
    const daysDiff = Math.floor((today.getTime() - mailDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  isUnread(mail: EmailData): boolean {
    return mail.status === 'Processing';
  }

  // Updated method to handle HTML content instead of markdown
  sanitizeHtmlContent(html: string): SafeHtml {
    if (!html) return '';
    
    // Clean and sanitize HTML content
    let cleanedHtml = html
      // Remove any potentially harmful scripts
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      // Remove any potentially harmful event handlers
      .replace(/on\w+="[^"]*"/gi, '')
      // Remove any potentially harmful styles that might break layout
      .replace(/javascript:/gi, '')
      // Ensure tables have proper styling classes
      .replace(/<table([^>]*)>/gi, '<table$1 class="email-table">')
      // Ensure links open in new tab for security
      .replace(/<a([^>]*href="[^"]*")([^>]*)>/gi, '<a$1$2 target="_blank" rel="noopener noreferrer">');
    
    return this.sanitizer.bypassSecurityTrustHtml(cleanedHtml);
  }

  // Keep the old method as fallback for backward compatibility
  formatMarkdownContent(content: string): SafeHtml {
    if (!content) return '';
    
    // Convert markdown-like formatting to HTML
    let formattedContent = content
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert _italic_ to <em>
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Convert line breaks to <br>
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Convert tables (basic markdown table support)
      .replace(/\|(.+)\|/g, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        const isHeader = content.includes('---');
        if (isHeader) {
          return '<tr>' + cells.map((cell: string) => cell === '---' ? '' : `<th>${cell}</th>`).join('') + '</tr>';
        }
        return '<tr>' + cells.map((cell: string) => `<td>${cell}</td>`).join('') + '</tr>';
      })
      // Wrap table rows in table
      .replace(/(<tr>.*<\/tr>)/g, '<table class="email-table">$1</table>')
      // Convert links [text](url) to <a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Convert URLs to clickable links
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Wrap content in paragraphs if not already wrapped
    if (!formattedContent.includes('<p>') && !formattedContent.includes('<table>')) {
      formattedContent = '<p>' + formattedContent + '</p>';
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(formattedContent);
  }

  downloadAttachment(attachment: { name: string; url: string; type: string }): void {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Downloading attachment:', attachment.name);
  }

  getFileType(filename: string): string {
    if (!filename) return 'Unknown';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'xlsx':
      case 'xlsb':
      case 'xls':
        return 'Excel Spreadsheet';
      case 'docx':
      case 'doc':
        return 'Word Document';
      case 'pptx':
      case 'ppt':
        return 'PowerPoint';
      case 'txt':
        return 'Text File';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'Image';
      case 'zip':
      case 'rar':
        return 'Archive';
      default:
        return extension?.toUpperCase() + ' File' || 'Unknown';
    }
  }

  openInbox(): void {
    this.isOpen = true;
  }

  openComposer(draft?: any): void {
    this.isOpen = true;
    this.emailDraft = draft || { to: '', subject: '', body: '' };
  }

   attachments = [
    { name: 'report.pdf' },
    { name: 'slides.PPTX' },
    { name: 'data.csv' },
    { name: 'photo.jpeg' },
    { name: 'archive.tar.gz' },
    { name: 'README' }
  ];

  // map extension -> svg path under assets/icons/
  private extensionIconMap = new Map<string, string>([
    ['pdf', 'assets/icons/pdf-icon.svg'],
    ['doc', 'assets/icons/file-word.svg'],
    ['docx', 'assets/icons/file-word.svg'],
    ['xls', 'assets/icons/excel-icon.png'],
    ['xlsx', 'assets/icons/excel-icon.png'],
    ['xlsb', 'assets/icons/excel-icon.png'],
    ['csv', 'assets/icons/file-csv.svg'],
    ['ppt', 'assets/icons/file-powerpoint.svg'],
    ['pptx', 'assets/icons/file-powerpoint.svg'],
    ['jpg', 'assets/icons/file-image.svg'],
    ['jpeg', 'assets/icons/file-image.svg'],
    ['png', 'assets/icons/file-image.svg'],
    ['gif', 'assets/icons/file-image.svg'],
    ['svg', 'assets/icons/file-image.svg'],
    ['txt', 'assets/icons/file-text.svg'],
    ['zip', 'assets/icons/file-zip.svg'],
    ['rar', 'assets/icons/file-zip.svg'],
    ['7z', 'assets/icons/file-zip.svg'],
    ['mp3', 'assets/icons/file-audio.svg'],
    ['wav', 'assets/icons/file-audio.svg'],
    ['mp4', 'assets/icons/file-video.svg'],
    ['mov', 'assets/icons/file-video.svg']
  ]);

  private defaultIcon = 'assets/icons/file-default.svg';

  // safe ext extractor: handles names like "archive.tar.gz" or "README"
  private extractExtension(filename?: string): string | null {
    if (!filename) return null;
    // remove query params if someone attaches a URL-like name
    const clean = filename.split('?')[0].split('#')[0];
    const parts = clean.split('.');
    if (parts.length <= 1) return null;

    // if last piece is very short (like "gz") try to map common double-ext patterns:
    const last = parts[parts.length - 1].toLowerCase();
    const secondLast = parts[parts.length - 2]?.toLowerCase();

    // handle common archive double extensions
    if ((last === 'gz' || last === 'bz2' || last === 'xz') && secondLast) {
      // prefer secondLast (e.g., tar.gz -> tar)
      return secondLast;
    }

    return last;
  }

  getIconForFile(filename?: string): string {
    const ext = this.extractExtension(filename);
    if (!ext) return this.defaultIcon;
    return this.extensionIconMap.get(ext) ?? this.defaultIcon;
  }

  getFileTypeLabel(filename?: string): string {
    const ext = this.extractExtension(filename);
    return ext ? ext.toUpperCase() : 'Unknown';
  }

  // fallback handler if svg/png fails to load
  onIconError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    img.src = this.defaultIcon;
    img.alt = 'file';
  }
}