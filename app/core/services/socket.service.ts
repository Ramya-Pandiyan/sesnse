import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private hasSocketData$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.socket = io('https://sense-dev-backend-service-as.azurewebsites.net', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => console.log('[Socket] Connected:', this.socket.id));
    this.socket.on('disconnect', () => console.log('[Socket] Disconnected.'));
    this.socket.on('connect_error', (err) => console.error('[Socket] Connect Error:', err));

    this.socket.on('new_email', (email) => {
      this.hasSocketData$.next(true);
    });

    this.socket.on('progress_update', (data) => {
      this.hasSocketData$.next(true);
    });
  }

  // allow components to reactively listen
  getHasSocketData() {
    return this.hasSocketData$.asObservable();
  }

  // if you need to reset after reading
  setHasSocketData(value: boolean) {
    this.hasSocketData$.next(value);
  }

  // Expose socket events
  onNewEmail(cb: (email: any) => void) {
    this.socket.on('new_email', cb);
  }

  onProgressUpdate(cb: (data: any) => void) {
    this.socket.on('progress_update', cb);
  }
}
