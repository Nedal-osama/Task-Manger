import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, LoginResponse } from '../../services/login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loading = false;
  errorMessage = '';
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const model: LoginRequest = this.form.value;

    this.authService.login(model).subscribe({
      next: (res: LoginResponse) => {
        this.loading = false;

        console.log('User:', res.displayName);

        this.router.navigate(['/snippets']);
      },
      error: (err) => {
        this.loading = false;

        this.errorMessage = err?.error?.title || err?.error?.detail || 'InCorrectPassword';
      },
    });
  }
}
