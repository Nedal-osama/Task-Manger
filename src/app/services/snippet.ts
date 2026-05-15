import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './login';

export interface ApiResponse<T> {
  succeeded: boolean;
  message?: string;
  errors?: string[];
  data: T;
}

export interface ApiScript {
  id: number;
  title: string;
  description: string;
  sqlContent: string;
  fileUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Snippetservice {
  private baseUrl = 'https://nedaltsksmanagement.runasp.net/api/Scripts';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private getEmail(): string {
    return this.authService.getEmail();
  }

  getAll(): Observable<ApiScript[]> {
    return this.http.get<ApiResponse<ApiScript[]>>(this.baseUrl).pipe(map((res) => res.data || []));
  }

  create(formData: FormData) {
    const email = encodeURIComponent(this.getEmail());
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}?email=${email}`, formData);
  }

  update(id: number, formData: FormData) {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, formData);
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }
}
