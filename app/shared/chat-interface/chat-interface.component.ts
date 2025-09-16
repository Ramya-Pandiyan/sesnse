import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Common } from '../common/common.service';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.scss'
})
export class ChatInterfaceComponent {
  @Input() placeholder = 'Type your message...';
  @Input() disabled = false;
  @Output() messageSubmitted = new EventEmitter<string>();
  constructor(private common: Common) {

  }

  ngOnInit(): void {
    this.common.selectedText$.subscribe(text => {
      if (text) {
        this.message = text; 
      }
    });
  }
  message = '';

  onSubmit(): void {
    if (this.message.trim() && !this.disabled) {
      this.messageSubmitted.emit(this.message.trim());
      this.message = '';
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement;
  textarea.style.height = 'auto'; // reset height
  textarea.style.height = textarea.scrollHeight + 'px'; // fit content
}

  
}