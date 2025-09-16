import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Common } from '../common/common.service';
import { SocketService } from '../../core/services/socket.service';

interface EmailData {
  txn_id: string;
  subject: string;
  from: string;
}

interface ProgressData {
  email_id: string;
  progress: number;
  step?: string;
  message?: string;
}

@Component({
  selector: 'app-email-workflow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-notification.component.html',
  styleUrl: './email-notification.component.scss'
})
export class EmailWorkflowComponent {
  emails: EmailData[] = [];
  currentEmailId: string | null = null;
  emailProgress: Record<string, { progress: number; logs: string[] }> = {};

  constructor(private commonService: Common, private socketService: SocketService) {
    this.socketService.onNewEmail((email: EmailData) => this.addEmail(email));
    this.socketService.onProgressUpdate((data: ProgressData) => this.updateProgress(data));
  }

  // --- Helper Methods ---
  addEmail(email: EmailData) {
    this.emails.push(email);
    if (!this.emailProgress[email.txn_id]) {
      this.emailProgress[email.txn_id] = { progress: 0, logs: [] };
    }
    this.selectEmail(email.txn_id);
  }

  selectEmail(emailId: string) {
    this.currentEmailId = emailId;
  }

  updateProgress(data: ProgressData) {
    if (!this.emailProgress[data.email_id]) {
      this.emailProgress[data.email_id] = { progress: 0, logs: [] };
    }

    this.emailProgress[data.email_id].progress = data.progress || 0;
    this.emailProgress[data.email_id].logs.push(`${data.message || ''}`);
  }

  // --- UI Getters ---
  get currentProgress(): number {
    return this.currentEmailId ? this.emailProgress[this.currentEmailId]?.progress || 0 : 0;
  }

  get currentLogs(): string[] {
    return this.currentEmailId ? this.emailProgress[this.currentEmailId]?.logs || [] : [];
  }
}
