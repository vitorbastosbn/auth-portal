import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
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
import { MatDividerModule } from '@angular/material/divider';
import { ClientServiceService } from '../../../core/services/client-service.service';
import {
  ClientServiceResponse,
  ClientServiceRoleResponse,
  ClientUserMembershipResponse,
} from '../../../core/models/client-service.models';
import { RoleFormDialogComponent } from './role-form-dialog/role-form-dialog.component';
import { UserMembershipDialogComponent } from './user-membership-dialog/user-membership-dialog.component';
import { RegisterAndAssignDialogComponent } from './register-and-assign-dialog/register-and-assign-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-client-service-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './client-service-detail.component.html',
  styleUrl: './client-service-detail.component.scss',
})
export class ClientServiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ClientServiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly serviceId = this.route.snapshot.paramMap.get('id')!;
  readonly clientService = signal<ClientServiceResponse | null>(null);
  readonly roles = signal<ClientServiceRoleResponse[]>([]);
  readonly users = signal<ClientUserMembershipResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly usersTotalElements = signal(0);
  readonly usersPage = signal(0);
  readonly usersPageSize = signal(20);
  readonly usersSearchControl = new FormControl('', { nonNullable: true });

  readonly rolesColumns = ['code', 'description', 'status', 'actions'];
  readonly usersColumns = ['username', 'email', 'roles', 'status', 'actions'];

  ngOnInit(): void {
    this.loadAll();

    this.usersSearchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.usersPage.set(0);
      this.loadUsers();
    });
  }

  loadAll(): void {
    this.loading.set(true);
    this.service.getById(this.serviceId).subscribe({
      next: (cs) => {
        this.clientService.set(cs);
        this.loadRoles();
        this.loadUsers();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o serviço.');
        this.loading.set(false);
      },
    });
  }

  loadRoles(): void {
    this.service.listRoles(this.serviceId).subscribe({
      next: (data) => this.roles.set(data),
    });
  }

  loadUsers(): void {
    const query = this.usersSearchControl.value.trim() || undefined;
    this.service.listUsers(this.serviceId, { query, page: this.usersPage(), size: this.usersPageSize() }).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.usersTotalElements.set(page.totalElements);
      },
    });
  }

  onUsersPageChange(event: PageEvent): void {
    this.usersPage.set(event.pageIndex);
    this.usersPageSize.set(event.pageSize);
    this.loadUsers();
  }

  // --- Roles ---
  openCreateRoleDialog(): void {
    const ref = this.dialog.open(RoleFormDialogComponent, {
      width: '440px',
      data: { serviceId: this.serviceId, role: null },
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.loadRoles();
        this.snackBar.open('Role criada com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  openEditRoleDialog(role: ClientServiceRoleResponse): void {
    const ref = this.dialog.open(RoleFormDialogComponent, {
      width: '440px',
      data: { serviceId: this.serviceId, role },
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadRoles();
        this.snackBar.open('Role atualizada com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  deleteRole(role: ClientServiceRoleResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remover Role',
        message: `Deseja remover a role <strong>${role.code}</strong>? Esta ação não pode ser desfeita.`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.service.deleteRole(this.serviceId, role.id).subscribe({
          next: () => {
            this.loadRoles();
            this.snackBar.open('Role removida!', 'Fechar', { duration: 3000 });
          },
          error: (err) => {
            const msg = err?.error?.message ?? 'Erro ao remover role.';
            this.snackBar.open(msg, 'Fechar', { duration: 4000 });
          },
        });
      }
    });
  }

  // --- Users ---
  openRegisterAndAssignDialog(): void {
    const availableRoles = this.roles().map((r) => r.code);
    const ref = this.dialog.open(RegisterAndAssignDialogComponent, {
      width: '560px',
      disableClose: true,
      data: { serviceId: this.serviceId, availableRoles },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
        this.snackBar.open(
          `Usuário "${result.user.username}" cadastrado e vinculado com sucesso!`,
          'Fechar',
          { duration: 4000 },
        );
      }
    });
  }

  openAssignUserDialog(): void {
    const availableRoles = this.roles().map((r) => r.code);
    const ref = this.dialog.open(UserMembershipDialogComponent, {
      width: '480px',
      data: { serviceId: this.serviceId, membership: null, availableRoles },
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.loadUsers();
        this.snackBar.open('Usuário vinculado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  openEditUserDialog(membership: ClientUserMembershipResponse): void {
    const availableRoles = this.roles().map((r) => r.code);
    const ref = this.dialog.open(UserMembershipDialogComponent, {
      width: '480px',
      data: { serviceId: this.serviceId, membership, availableRoles },
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadUsers();
        this.snackBar.open('Membership atualizado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  removeUser(membership: ClientUserMembershipResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remover Usuário',
        message: `Deseja remover o vínculo do usuário <strong>${membership.username}</strong>?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.service.removeUser(this.serviceId, membership.userId).subscribe({
          next: () => {
            this.loadUsers();
            this.snackBar.open('Usuário desvinculado!', 'Fechar', { duration: 3000 });
          },
          error: (err) => {
            const msg = err?.error?.message ?? 'Erro ao remover usuário.';
            this.snackBar.open(msg, 'Fechar', { duration: 4000 });
          },
        });
      }
    });
  }
}
