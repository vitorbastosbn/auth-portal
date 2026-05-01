import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClientServiceService } from '../../../../core/services/client-service.service';
import { ClientServiceRoleResponse } from '../../../../core/models/client-service.models';

interface DialogData {
  serviceId: string;
  role: ClientServiceRoleResponse | null;
}

@Component({
  selector: 'app-role-form-dialog',
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
  templateUrl: './role-form-dialog.component.html',
})
export class RoleFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClientServiceService);
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly isEdit = !!this.data.role;

  readonly form = this.fb.nonNullable.group({
    code: [
      { value: this.data.role?.code ?? '', disabled: this.isEdit },
      [Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern('^[A-Za-z0-9_:-]+$')],
    ],
    description: [this.data.role?.description ?? '', [Validators.maxLength(255)]],
    active: [this.data.role?.active ?? true],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const val = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.service.updateRole(this.data.serviceId, this.data.role!.id, {
          description: val.description,
          active: val.active,
        })
      : this.service.createRole(this.data.serviceId, {
          code: val.code,
          description: val.description,
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
