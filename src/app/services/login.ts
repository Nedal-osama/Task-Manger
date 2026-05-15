import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  displayName: string;
  email?: string;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://nedaltsksmanagement.runasp.net/api/Account/login';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.baseUrl, data).pipe(
      tap((res) => {
        const user = {
          displayName: res.displayName,
          email: res.email || data.email,
          token: res.token,
        };

        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        if (user.email) {
          localStorage.setItem('userEmail', user.email);
        }
      }),
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): LoginResponse | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as LoginResponse;
    } catch {
      return null;
    }
  }

  getEmail(): string {
    const user = this.getUser();
    if (user?.email) {
      return user.email;
    }

    return localStorage.getItem('userEmail') || '';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
