import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './right-panel.component.html',
  styleUrls: ['./right-panel.component.scss']
})

export class RightPanelComponent {
  @Input() isOpen = false;
  @Input() panelTitle = '';
  @Output() close = new EventEmitter<void>();

  panelWidth = 600; // default
  private startX = 0;
  private startWidth = 0;
  private isResizing = false;

  onClose(): void {
    this.isOpen = false;
    this.close.emit();
  }

  onResizeStart(event: MouseEvent): void {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.panelWidth;

    const container = document.querySelector('.right-panel-container');
    container?.classList.add('resizing');

    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  onResizing = (event: MouseEvent) => {
    if (!this.isResizing) return;

    const dx = this.startX - event.clientX; // dragging left increases width
    let newWidth = this.startWidth + dx;

    newWidth = Math.max(600, Math.min(newWidth, 2500)); // clamp min/max

    this.panelWidth = newWidth;
  };

  onResizeEnd = () => {
    this.isResizing = false;

    const container = document.querySelector('.right-panel-container');
    container?.classList.remove('resizing');

    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };
}
