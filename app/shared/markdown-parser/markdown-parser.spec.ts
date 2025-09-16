import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownParser } from './markdown-parser.component';

describe('MarkdownParser', () => {
  let component: MarkdownParser;
  let fixture: ComponentFixture<MarkdownParser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownParser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkdownParser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
