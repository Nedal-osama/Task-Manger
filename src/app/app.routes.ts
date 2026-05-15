import { Routes } from '@angular/router';
import { Snippets } from './components/snippets/snippets';
import { ETasks } from './components/e-tasks/e-tasks';
import { Links } from './components/links/links';
import { Login } from './auth/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'snippets', pathMatch: 'full' },
      { path: 'snippets', component: Snippets },
      { path: 'tasks', component: ETasks },
      { path: 'links', component: Links },
    ],
  },

  { path: '**', redirectTo: 'snippets' },
];
