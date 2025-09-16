import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
  this.loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
}

copiedField: string | null = null;

copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    if (text === 'sense@bluepond.ai') {
      this.copiedField = 'email';
    } else {
      this.copiedField = 'password';
    }

    setTimeout(() => {
      this.copiedField = null;
    }, 1500); // hide after 1.5s
  });
}

  onSubmit(): void {
  if (this.loginForm.valid && !this.isLoading) {
    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('Login successful! Welcome back.');
          this.router.navigate(['/dashboard']);
        } else {
          this.notificationService.showError(response.message || 'Invalid credentials. Please try again.');
          this.isLoading = false;
        }
      },
      error: (error) => {
        // This only runs if it's a real HTTP error
        this.notificationService.showError(error.message || 'Something went wrong. Please try again later.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}


  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
  const displayNames: { [key: string]: string } = {
    email: 'Email',
    password: 'Password'
  };
  return displayNames[fieldName] || fieldName;
}


  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}