import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { RightSidebarComponent } from '../../../shared/right-sidebar/right-sidebar.component';
import { NotificationService, Toast } from '../../../core/services/notification.service';
import { Common } from '../../../shared/common/common.service';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, RightSidebarComponent],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss'
})
export class HomeLayoutComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  showRightSidebar = false;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private commonService: Common
  ) {}

  ngOnInit(): void {
    this.notificationService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => {
        this.toasts = toasts;
      });

    this.commonService.underwritingClicked$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showRightSidebar = true;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: string): void {
    this.notificationService.removeToast(id);
  }

  onUnderwritingClicked(): void {
    this.showRightSidebar = true;
  }
}