import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AdminUserService, CreatedUser } from '../../../../core/services/admin-user.service';
import { ClientServiceService } from '../../../../core/services/client-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DialogData {
  serviceId: string;
  availableRoles: string[];
}

@Component({
  selector: 'app-register-and-assign-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './register-and-assign-dialog.component.html',
  styleUrl: './register-and-assign-dialog.component.scss',
})
export class RegisterAndAssignDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminUserService = inject(AdminUserService);
  private readonly clientServiceService = inject(ClientServiceService);
  private readonly dialogRef = inject(MatDialogRef<RegisterAndAssignDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loadingRegister = signal(false);
  readonly loadingAssign = signal(false);
  readonly createdUser = signal<CreatedUser | null>(null);
  readonly registerError = signal<string | null>(null);
  readonly assignError = signal<string | null>(null);

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern('^[a-zA-Z0-9._-]+$')]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  readonly assignForm = this.fb.nonNullable.group({
    roles: [[] as string[], [Validators.required]],
    active: [true],
  });

  register(): void {
    if (this.registerForm.invalid || this.loadingRegister()) return;
    this.loadingRegister.set(true);
    this.registerError.set(null);

    this.adminUserService.register(this.registerForm.getRawValue()).subscribe({
      next: (user) => {
        this.loadingRegister.set(false);
        this.createdUser.set(user);
      },
      error: (err) => {
        this.loadingRegister.set(false);
        this.registerError.set(err?.error?.message ?? 'Erro ao cadastrar usuário.');
      },
    });
  }

  assign(): void {
    if (this.assignForm.invalid || this.loadingAssign()) return;
    const user = this.createdUser();
    if (!user) return;

    this.loadingAssign.set(true);
    this.assignError.set(null);
    const val = this.assignForm.getRawValue();

    this.clientServiceService.assignUser(this.data.serviceId, {
      userId: user.userId,
      roles: val.roles,
      active: val.active,
    }).subscribe({
      next: (membership) => {
        this.loadingAssign.set(false);
        this.dialogRef.close({ user, membership });
      },
      error: (err) => {
        this.loadingAssign.set(false);
        this.assignError.set(err?.error?.message ?? 'Erro ao vincular usuário ao serviço.');
      },
    });
  }
}
