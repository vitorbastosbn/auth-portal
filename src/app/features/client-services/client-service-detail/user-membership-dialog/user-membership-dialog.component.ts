import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { ClientServiceService } from '../../../../core/services/client-service.service';
import { ClientUserMembershipResponse } from '../../../../core/models/client-service.models';

interface DialogData {
  serviceId: string;
  membership: ClientUserMembershipResponse | null;
  availableRoles: string[];
}

@Component({
  selector: 'app-user-membership-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSelectModule,
  ],
  templateUrl: './user-membership-dialog.component.html',
})
export class UserMembershipDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClientServiceService);
  private readonly dialogRef = inject(MatDialogRef<UserMembershipDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly isEdit = !!this.data.membership;

  readonly form = this.fb.nonNullable.group({
    userId: [
      { value: this.data.membership?.userId ?? '', disabled: this.isEdit },
      [Validators.required, Validators.minLength(1)],
    ],
    roles: [this.data.membership?.roles ?? ([] as string[]), [Validators.required]],
    active: [this.data.membership?.active ?? true],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const val = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.service.updateUserMembership(this.data.serviceId, this.data.membership!.userId, {
          roles: val.roles,
          active: val.active,
        })
      : this.service.assignUser(this.data.serviceId, {
          userId: val.userId,
          roles: val.roles,
          active: val.active,
        });

    request$.subscribe({
      next: (result) => {
        this.loading.set(false);
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
      },
    });
  }
}
