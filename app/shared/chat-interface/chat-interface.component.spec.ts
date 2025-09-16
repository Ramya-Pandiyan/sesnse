import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ChatInterfaceComponent } from './chat-interface.component';

describe('ChatInterfaceComponent', () => {
  let component: ChatInterfaceComponent;
  let fixture: ComponentFixture<ChatInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInterfaceComponent, FormsModule]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ChatInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit message when submitted', () => {
    spyOn(component.messageSubmitted, 'emit');
    component.message = 'test message';
    component.onSubmit();
    
    expect(component.messageSubmitted.emit).toHaveBeenCalledWith('test message');
    expect(component.message).toBe('');
  });
});