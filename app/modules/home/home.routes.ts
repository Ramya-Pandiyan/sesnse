import { Routes } from '@angular/router';

export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home-layout/home-layout.component').then(m => m.HomeLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./empty-chat/empty-chat.component').then(m => m.EmptyChatComponent)
      },
      {
        path: 'chat/:chatId',
        loadComponent: () => import('./existing-chat/existing-chat.component').then(m => m.ExistingChatComponent)
      },
      {
        path: 'underwriting',
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./underwriting-dashboard/underwriting-dashboard.component').then(m => m.UnderwritingDashboardComponent)
          },
          {
            path: 'submission/:id',
            loadComponent: () => import('../../layout/submission-detail/submission-detail.component').then(m => m.SubmissionDetailComponent)
          }
        ]
      }
    ]
  }
];