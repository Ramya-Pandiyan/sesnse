import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EmailWorkflowComponent } from './shared/email-notification/email-notification.component';
import { SocketService } from './core/services/socket.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, EmailWorkflowComponent],
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Sense';
  constructor(private socketService: SocketService) {
    console.log('Connected')
  }
}