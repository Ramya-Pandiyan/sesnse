import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface Submission {
  id: string;
  insuredName: string;
  receivedDate: string;
  status: 'new' | 'in-review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: 'due-today' | 'needs-review' | 'watchlist';
  claimId?: string;
  market?: string;
  homeState?: string;
  dateOfLoss?: string;
  catNumber?: string;
  lossCause?: string;
}

export interface SubmissionDetail {
  id: string;
  emailSummary: string;
  insuredOperations: any;
  lossExperience: any;
  appetiteCheck: any;
  missingInformation: string[];
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  hasAction?: boolean;
  actionText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  constructor(private http: HttpClient) { }

  getSubmissionInsights(submissionId: string) {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/submissions/${submissionId}/insights`;
    return this.http.get(url);
  }

  getSubmissions(): Observable<any> {
    return this.http.get<any>('https://sense-dev-backend-service-as.azurewebsites.net/api/v1/submissions').pipe(   // <-- replace with actual API URL
      map((response: any) => {
        return {
          watchlist: response.watchlist?.map((item: any) => this.transform(item, 'watchlist')) || [],
          dueToday: response.deadline?.map((item: any) => this.transform(item, 'due-today')) || [],
          needsReview: response.high_priority?.map((item: any) => this.transform(item, 'needs-review')) || [],
          all: response.all_submissions?.map((item: any) => this.transform(item, 'all')) || [],
        };
      })
    );
  }

  private transform(item: any, type: string): any {
    return {
      id: item.submission_id,
      insuredName: item.insured_name,
      brokerId: item.broker_id,
      receivedDate: item.created_date,
      priority: item.priority,
      reply_count: item.reply_count,
      type
    };
  }

  getSubmissionDetail(id: string): Observable<any> {
    return this.http.get('/assets/mock-data/submission-detail.json').pipe(delay(500));
  }

  getChatHistory(): Observable<any> {
    return this.http.get<any>(
      'https://sense-dev-backend-service-as.azurewebsites.net/api/v1/chats'
    );
  }

  getInitialChatMessages(): Observable<any> {
    return this.http.get('/assets/mock-data/initial-chat.json').pipe(delay(800));
  }
  sendEmailToBroker(submissionId: string, payload: { to: string; subject: string; body: string }) {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/send-mail`;
    return this.http.post<any>(url, payload);
  }

  getEmailDraft(): Observable<any> {
    return this.http.get('/assets/mock-data/email-draft.json').pipe(delay(500));
  }

  createChat(chatData: { title: string }): Observable<any> {
    const url = 'https://sense-dev-backend-service-as.azurewebsites.net/api/v1/chats';
    return this.http.post<any>(url, chatData);
  }

  deleteChat(chatId: string): Observable<any> {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/chats/${chatId}`;
    return this.http.delete<any>(url);
  }

  getChatById(chatId: string) {
    return this.http.get<any>(`https://sense-dev-backend-service-as.azurewebsites.net/api/v1/chats/${chatId}`);
  }

  sendMessage(chatId: string, content: string) {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/conversations/${chatId}/messages`;
    const body = { message: { content } };
    return this.http.post<any>(url, body);
  }

  getConversation(chatId: string) {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/conversations/${chatId}`;
    return this.http.get<any>(url);
  }

  getPdfUrl(submissionId: string, mailId: string): Observable<{ url: string }> {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/submissions/${submissionId}/mails/${mailId}/loss_data`;
    return this.http.get<{ url: string }>(url); // <-- returns the JSON with 'url' field
  }

  getPdfBlob(submissionId: string, mailId: string) {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/submissions/${submissionId}/mails/${mailId}/loss_data`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getMails() {
    const subId = 'SUB-38431'
    return this.http.get<any>(`https://sense-dev-backend-service-as.azurewebsites.net/api/v1/submissions/${subId}/mails`);
  }
}