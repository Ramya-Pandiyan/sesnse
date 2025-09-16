import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  templateUrl: './pdf-preview.component.html',
  styleUrls: ['./pdf-preview.component.scss'],
  imports: [CommonModule, PdfViewerModule]  
})
export class PdfPreviewComponent {
  @Input() url: string = '';
}
