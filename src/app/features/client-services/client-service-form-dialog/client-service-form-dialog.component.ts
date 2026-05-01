import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClientServiceService } from '../../../core/services/client-service.service';
import { ClientServiceResponse } from '../../../core/models/client-service.models';

@Component({
  selector: 'app-client-service-form-dialog',
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
  templateUrl: './client-service-form-dialog.component.html',
})
export class ClientServiceFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClientServiceService);
  private readonly dialogRef = inject(MatDialogRef<ClientServiceFormDialogComponent>);
  readonly data: ClientServiceResponse | null = inject(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly isEdit = !!this.data;

  readonly form = this.fb.nonNullable.group({
    code: [
      { value: this.data?.code ?? '', disabled: this.isEdit },
      [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern('^[A-Za-z0-9._-]+$')],
    ],
    name: [this.data?.name ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: [this.data?.description ?? '', [Validators.maxLength(255)]],
    active: [this.data?.active ?? true],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const val = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.service.update(this.data!.id, { name: val.name, description: val.description, active: val.active })
      : this.service.create({ code: val.code, name: val.name, description: val.description });

    request$.subscribe({
      next: (result) => {
        this.loading.set(false);
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.loading.set(false);
        // Error snackbar handled by caller or can add here
        console.error(err);
      },
    });
  }
}
