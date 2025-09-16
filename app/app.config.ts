import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppInterceptor } from './data/interceptor/app.interceptor';
import { routes } from './app.routes';
import { authInterceptor } from './data/interceptor/auth.interceptor';
import { MarkdownModule } from 'ngx-markdown';
import { PdfViewerModule } from 'ng2-pdf-viewer';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
     importProvidersFrom(PdfViewerModule),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(MarkdownModule.forRoot()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppInterceptor,
      multi: true
    }
  ]
};