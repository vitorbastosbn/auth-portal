import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { AdminUserResponse } from '../../../core/models/admin-user.models';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminUserService = inject(AdminUserService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  readonly data: AdminUserResponse = inject(MAT_DIALOG_DATA);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: [
      this.data.username,
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        Validators.pattern('^[a-zA-Z0-9._-]+$'),
      ],
    ],
    email: [this.data.email, [Validators.required, Validators.email, Validators.maxLength(160)]],
    active: [this.data.active],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    const value = this.form.getRawValue();

    this.adminUserService
      .updateUser(this.data.userId, {
        username: value.username,
        email: value.email,
        active: value.active,
      })
      .subscribe({
        next: (updated) => {
          this.loading.set(false);
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.loading.set(false);
          console.error(err);
        },
      });
  }
}
