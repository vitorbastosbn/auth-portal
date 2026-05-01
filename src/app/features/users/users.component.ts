import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AdminUserResponse } from '../../core/models/admin-user.models';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly adminUserService = inject(AdminUserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<AdminUserResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly totalElements = signal(0);

  readonly page = signal(0);
  readonly pageSize = signal(20);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly displayedColumns = ['username', 'email', 'status', 'actions'];

  ngOnInit(): void {
    this.loadUsers();

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(0);
        this.loadUsers();
      });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    const query = this.searchControl.value.trim() || undefined;

    this.adminUserService
      .listUsers({ query, page: this.page(), size: this.pageSize() })
      .subscribe({
        next: (pageData) => {
          this.users.set(pageData.content);
          this.totalElements.set(pageData.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Não foi possível carregar os usuários.');
          this.loading.set(false);
        },
      });
  }

  openEditDialog(user: AdminUserResponse): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: user,
    });

    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadUsers();
        this.snackBar.open('Usuário atualizado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }
}
