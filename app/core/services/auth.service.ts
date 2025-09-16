import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
  const storedData = localStorage.getItem('authData'); // store everything under one key
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);

      const user = {
        id: parsed.user.user_id,
        firstName: parsed.user.first_name,
        lastName: parsed.user.last_name,
        email: parsed.user.email,
      } as User;
      // push into observable
      this.currentUserSubject.next(user);

      // save token for interceptor use
      localStorage.setItem('access_token', parsed.token);

    } catch (error) {
      console.error('Error parsing user from storage:', error);
      this.logout();
    }
  }
}


login(credentials: { email: string; password: string }): Observable<any> {
  return this.http.post<any>(
    'https://sense-dev-backend-service-as.azurewebsites.net/api/v1/users/login',
    credentials
  ).pipe(
    tap(response => {
      // save everything in one object (same shape as backend)
      localStorage.setItem('authData', JSON.stringify(response));

      const user = {
        id: response.user.user_id,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        email: response.user.email,
      } as User;

      this.currentUserSubject.next(user);

      // store tokens separately if interceptor uses them
      localStorage.setItem('token', response.token);
      // localStorage.setItem('refresh_token', response.bearer_token.refresh_token);
    })
  );
}

signup(userData: any): Observable<any> {
  return this.http.post<any>(
    'https://sense-dev-backend-service-as.azurewebsites.net/api/v1/users/signup',
    {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.confirmPassword,
      profile_picture: '',
      status: 'active'
    }
  ).pipe(
    tap(response => {
      const data = response.data;
      localStorage.setItem('authData', JSON.stringify(data));

      const user = {
        id: data.user.user_id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        email: data.user.email,
      } as User;

      this.currentUserSubject.next(user);

      localStorage.setItem('token', data.token);
    })
  );
}

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}