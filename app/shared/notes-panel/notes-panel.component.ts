import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RightPanelComponent } from '../right-panel/right-panel.component';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RightPanelComponent],
  templateUrl: './notes-panel.component.html',
  styleUrls: ['./notes-panel.component.scss']
})
export class NotesPanelComponent {
  @Input() isOpen = false;
  @Input() noteId = '';
  @Output() close = new EventEmitter<void>();

  currentNote: Note = {
    id: '',
    title: '',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  isSaving = false;
  private saveTimeout: any;

  ngOnInit() {
    if (this.noteId) {
      this.loadNote();
    } else {
      this.currentNote = {
        id: this.generateId(),
        title: 'Untitled Note',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  private loadNote(): void {
    // Load note from service or local storage
    const savedNote = localStorage.getItem(`note_${this.noteId}`);
    if (savedNote) {
      this.currentNote = JSON.parse(savedNote);
    }
  }

  onClose(): void {
    this.saveNote();
    this.close.emit();
  }

  formatText(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.onNoteChange();
  }

  isFormatActive(command: string): boolean {
    return document.queryCommandState(command);
  }

  insertLink(): void {
    const url = prompt('Enter the URL:');
    if (url) {
      this.formatText('createLink', url);
    }
  }

  onContentChange(event: Event): void {
    this.currentNote.content = (event.target as HTMLElement).innerHTML;
    this.onNoteChange();
  }

  onNoteChange(): void {
    this.currentNote.updatedAt = new Date();
    this.debounceSave();
  }

  private debounceSave(): void {
    clearTimeout(this.saveTimeout);
    this.isSaving = true;
    
    this.saveTimeout = setTimeout(() => {
      this.saveNote();
      this.isSaving = false;
    }, 1000);
  }

  private saveNote(): void {
    localStorage.setItem(`note_${this.currentNote.id}`, JSON.stringify(this.currentNote));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}