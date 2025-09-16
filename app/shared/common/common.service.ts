import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Common {
  private underwritingClickedSource = new Subject<void>();
  underwritingClicked$ = this.underwritingClickedSource.asObservable();

   private sidebarOpenSource = new Subject<void>();
  sidebarOpen$ = this.sidebarOpenSource.asObservable();

  emitUnderwritingClicked() {
    this.underwritingClickedSource.next();
  }

  emitOpenSidebar() {
    this.sidebarOpenSource.next();
  }

   private socketDataSubject = new BehaviorSubject<boolean>(false);

  hasSocketData$ = this.socketDataSubject.asObservable();

  setHasSocketData(value: boolean) {
    this.socketDataSubject.next(value);
  }
  

  private selectedTextSource = new BehaviorSubject<string>('');
  selectedText$ = this.selectedTextSource.asObservable();

  setSelectedText(text: string) {
    this.selectedTextSource.next(text);
  }
  
}
