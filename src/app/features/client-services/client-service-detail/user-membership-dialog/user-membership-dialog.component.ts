import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ClientServiceService } from '../../../../core/services/client-service.service';
import {
  AssignableUserResponse,
  ClientUserMembershipResponse,
} from '../../../../core/models/client-service.models';

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
    MatAutocompleteModule,
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
  private readonly destroyRef = inject(DestroyRef);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly loadingUsers = signal(false);
  readonly isEdit = !!this.data.membership;
  readonly userOptions = signal<AssignableUserResponse[]>([]);
  private suppressNextSearch = false;

  readonly form = this.fb.nonNullable.group({
    userId: [
      { value: this.data.membership?.userId ?? '', disabled: this.isEdit },
      [Validators.required, Validators.minLength(1)],
    ],
    roles: [this.data.membership?.roles ?? ([] as string[]), [Validators.required]],
    active: [this.data.membership?.active ?? true],
  });

  readonly userSearch = this.fb.nonNullable.control('');

  constructor() {
    if (this.isEdit) return;

    this.userSearch.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        if (this.suppressNextSearch) {
          this.suppressNextSearch = false;
          return;
        }

        this.form.controls.userId.setValue('');
        this.searchAssignableUsers(query);
      });
  }

  searchAssignableUsers(rawQuery: string): void {
    const query = rawQuery.trim();

    this.loadingUsers.set(true);
    this.service.listAssignableUsers(this.data.serviceId, { query, page: 0, size: 10 }).subscribe({
      next: (page) => {
        this.userOptions.set(page.content);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.userOptions.set([]);
        this.loadingUsers.set(false);
      },
    });
  }

  selectUser(event: MatAutocompleteSelectedEvent): void {
    const selectedUserId = event.option.value as string;
    const selectedUser = this.userOptions().find((user) => user.userId === selectedUserId);
    if (!selectedUser) return;

    this.form.controls.userId.setValue(selectedUser.userId);
    this.suppressNextSearch = true;
    this.userSearch.setValue(`${selectedUser.username} (${selectedUser.email})`);
  }

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
