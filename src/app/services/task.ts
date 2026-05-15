import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './login';

export interface TaskModel {
  id: number;
  name: string;
  solution?: string;
  image?: string;
  path?: string;
  done: boolean;
  startDate: string;
  dueDate: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  updatedAt: string;
}

interface ApiTask {
  id: number;
  title: string;
  solution?: string;
  path?: string;
  startDate: string;
  endDate: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface ApiResponse<T> {
  succeeded: boolean;
  message?: string;
  errors?: string[];
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class Task {
  private baseUrl = 'https://nedaltsksmanagement.runasp.net/api/Tasks';
  private tasksSubject = new BehaviorSubject<TaskModel[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.loadTasks();
  }

  private mapApiTask(api: ApiTask): TaskModel {
    // Only consider endDate as "real" if it's not empty and not a default date
    const isValidEndDate = api.endDate && api.endDate.trim() && !api.endDate.includes('0001-01-01');

    const dueDate = isValidEndDate ? api.endDate : '';

    return {
      id: api.id,
      name: api.title,
      solution: api.solution || '',
      image: api.path || '',
      path: api.path || '',
      done: !!dueDate,
      startDate: api.startDate || '',
      dueDate: dueDate,
      status: api.status || 'New',
      priority: api.priority || 'Low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private getPath(task: Partial<TaskModel>): string {
    const candidate = task.path || task.image || '';
    if (candidate && candidate.trim() && /^(https?:\/\/)/.test(candidate)) {
      return candidate;
    }
    return '';
  }

  private mapToApi(task: Partial<TaskModel>): Partial<ApiTask> {
    const payload: Partial<ApiTask> = {
      title: task.name || '',
      solution: task.solution || '',
      startDate: task.startDate || new Date().toISOString(),
      status: task.status || 'New',
      priority: task.priority || 'Low',
    };

    const path = this.getPath(task);
    if (path) {
      payload.path = path;
    }

    if (task.dueDate) {
      payload.endDate = task.dueDate;
    }

    return payload;
  }

  private getEmail(): string {
    return this.authService.getEmail();
  }

  private loadTasks() {
    this.http
      .get<ApiResponse<ApiTask[]>>(this.baseUrl)
      .pipe(map((res) => (res.data || []).map((apiTask) => this.mapApiTask(apiTask))))
      .subscribe(
        (tasks) => this.tasksSubject.next(tasks),
        (error) => console.error('Error loading tasks:', error),
      );
  }

  getAll(): Observable<TaskModel[]> {
    return this.tasks$;
  }

  getAll$(): Observable<TaskModel[]> {
    return this.tasks$;
  }

  save(task: Partial<TaskModel>): Observable<void> {
    const email = this.getEmail();
    if (!email) {
      return throwError(() => new Error('Logged-in email is required to create tasks.'));
    }

    const payload = this.mapToApi(task);
    const encodedEmail = encodeURIComponent(email);
    return this.http
      .post<ApiResponse<string>>(`${this.baseUrl}?email=${encodedEmail}`, payload)
      .pipe(
        tap(() => this.loadTasks()),
        map(() => undefined),
      );
  }

  update(task: TaskModel): Observable<void> {
    const payload = this.mapToApi(task);
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/${task.id}`, payload).pipe(
      tap(() => this.loadTasks()),
      map(() => undefined),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const tasks = this.tasksSubject.value.filter((t) => t.id !== id);
        this.tasksSubject.next(tasks);
      }),
      map(() => undefined),
    );
  }

  deleteMultiple(ids: number[]): Observable<void> {
    const deletes = ids.map((id) => this.delete(id));
    return new Observable<void>((observer) => {
      let completed = 0;
      deletes.forEach((del) =>
        del.subscribe(() => {
          completed++;
          if (completed === deletes.length) {
            observer.next();
            observer.complete();
          }
        }),
      );
    });
  }

  getLastUpdateTime(): string {
    const tasks = this.tasksSubject.value;
    if (tasks.length === 0) return 'Never';
    const lastTask = tasks.reduce((latest, task) =>
      new Date(task.updatedAt) > new Date(latest.updatedAt) ? task : latest,
    );
    return new Date(lastTask.updatedAt).toLocaleString();
  }
}
