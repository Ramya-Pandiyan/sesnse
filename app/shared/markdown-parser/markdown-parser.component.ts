import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ParsedContent {
  type: 'heading' | 'paragraph' | 'list' | 'followup';
  content: any;
}

interface FollowUpQuestion {
  id: number;
  text: string;
}

@Component({
  selector: 'app-markdown-parser',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./markdown-parser.component.scss'],
  templateUrl: './markdown-parser.component.html'
})
export class MarkdownParserComponent {
  @Input() content: string = '';
  @Input() maxItems: number = 0;
  @Output() followUpSelected = new EventEmitter<FollowUpQuestion>();
  
  parsedContent: any[] = [];

  ngOnInit() {
    this.parseContent();
  }

  ngOnChanges() {
    this.parseContent();
  }

  private parseContent(): void {
    if (!this.content) return;
    
    const lines = this.content.split('\n');
    this.parsedContent = [];
    let currentList: string[] = [];
    let inFollowUp = false;
    let followUpQuestions: FollowUpQuestion[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        this.flushCurrentList(currentList);
        currentList = [];
        continue;
      }

      // Check for follow-up section
      if (line.includes('I can help with a few things') || inFollowUp) {
        inFollowUp = true;
        const questionMatch = line.match(/^\s*(\d+)\.\s*(.+)/);
        if (questionMatch) {
          followUpQuestions.push({
            id: parseInt(questionMatch[1]),
            text: questionMatch[2]
          });
        }
        continue;
      }

      // Headings
      if (line.startsWith('###') || line.startsWith('##')) {
        this.flushCurrentList(currentList);
        currentList = [];
        
        const headingText = line.replace(/^#+\s*/, '');
        this.parsedContent.push({
          type: 'heading',
          content: this.processSpanTags(headingText)
        });
      }
      // List items
      else if (line.startsWith('-') || line.startsWith('•')) {
        const listItem = line.replace(/^[-•]\s*/, '');
        currentList.push(this.processSpanTags(listItem));
      }
      // Paragraphs
      else if (!line.startsWith('---')) {
        this.flushCurrentList(currentList);
        currentList = [];
        
        this.parsedContent.push({
          type: 'paragraph',
          content: this.processSpanTags(line)
        });
      }
    }

    this.flushCurrentList(currentList);
    
    if (followUpQuestions.length > 0) {
      this.parsedContent.push({
        type: 'followup',
        content: followUpQuestions,
      });
    }
  }

  private flushCurrentList(currentList: string[]): void {
    if (currentList.length > 0) {
      this.parsedContent.push({
        type: 'list',
        content: [...currentList],
        expanded: false
      });
    }
  }

  private processSpanTags(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<span style="color:yellow">(.*?)<\/span>/g, '<span class="highlight-yellow">$1</span>')
      .replace(/<span style="color:green">(.*?)<\/span>/g, '<span class="highlight-green">$1</span>')
      .replace(/<span style="color:red">(.*?)<\/span>/g, '<span class="highlight-red">$1</span>');
  }

  getVisibleItems(items: string[]): string[] {
    const section = this.parsedContent.find(s => s.content === items);
    if (!section || section.expanded) {
      return items;
    }
    return items.slice(0, this.maxItems);
  }

  toggleExpanded(section: any): void {
    section.expanded = !section.expanded;
  }

  onFollowUpClick(question: FollowUpQuestion): void {
    this.followUpSelected.emit(question);
  }

  trackBySection(index: number, section: ParsedContent): any {
    return section.type + index;
  }
}