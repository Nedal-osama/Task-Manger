import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './services/login';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  currentRoute = signal<string>('scripts');
  title = signal('📝 Scripts - Task Manager');
  isLoginPage = signal<boolean>(false);

  private platformId = inject(PLATFORM_ID);

  constructor(
    private router: Router,
    private titleService: Title,
    private authService: AuthService,
  ) {
    const updateRouteState = (url: string) => {
      this.isLoginPage.set(url.includes('/login'));

      if (url.includes('/tasks')) {
        this.currentRoute.set('tasks');
        this.title.set('✓ Tasks - Task Manager');
        this.titleService.setTitle('Tasks - Task Manager');
      } else if (url.includes('/links')) {
        this.currentRoute.set('links');
        this.title.set('🔗 Links - Task Manager');
        this.titleService.setTitle('Links - Task Manager');
      } else {
        this.currentRoute.set('scripts');
        this.title.set('📝 Scripts - Task Manager');
        this.titleService.setTitle('Scripts - Task Manager');
      }
    };

    updateRouteState(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        updateRouteState((event as NavigationEnd).urlAfterRedirects);
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], {
      replaceUrl: true,
    });
  }
}
