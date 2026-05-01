import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(1)]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly loading = signal(false);
  readonly hidePassword = signal(true);

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        if (!this.authService.isAdmin()) {
          this.authService.logout();
          this.snackBar.open('Acesso negado. Apenas administradores podem acessar este portal.', 'Fechar', { duration: 5000 });
          this.loading.set(false);
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.loading.set(false);
        const msg =
          err?.error?.message ?? 'Credenciais inválidas. Verifique seu usuário e senha.';
        this.snackBar.open(msg, 'Fechar', { duration: 4000 });
      },
    });
  }
}
