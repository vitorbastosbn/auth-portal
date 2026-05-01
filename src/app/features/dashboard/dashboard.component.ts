import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import { ClientServiceService } from '../../core/services/client-service.service';
import { ClientServiceResponse } from '../../core/models/client-service.models';
import { AuthService } from '../../core/services/auth.service';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AdminUserResponse } from '../../core/models/admin-user.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly clientServiceService = inject(ClientServiceService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly services = signal<ClientServiceResponse[]>([]);
  readonly users = signal<AdminUserResponse[]>([]);
  readonly usersTotalElements = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin({
      services: this.clientServiceService.list(),
      users: this.adminUserService.listUsers({ page: 0, size: 20 }),
    }).subscribe({
      next: ({ services, users }) => {
        this.services.set(services.content);
        this.users.set(users.content);
        this.usersTotalElements.set(users.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os dados.');
        this.loading.set(false);
      },
    });
  }

  get activeServices(): number {
    return this.services().filter((s) => s.active).length;
  }

  get inactiveServices(): number {
    return this.services().filter((s) => !s.active).length;
  }

  get activeUsers(): number {
    return this.users().filter((u) => u.active).length;
  }

  get inactiveUsers(): number {
    return this.users().filter((u) => !u.active).length;
  }
}
