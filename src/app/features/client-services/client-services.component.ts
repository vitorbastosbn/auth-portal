import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
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
import { MatChipsModule } from '@angular/material/chips';
import { ClientServiceService } from '../../core/services/client-service.service';
import { ClientServiceResponse } from '../../core/models/client-service.models';
import { ClientServiceFormDialogComponent } from './client-service-form-dialog/client-service-form-dialog.component';

@Component({
  selector: 'app-client-services',
  standalone: true,
  imports: [
    RouterLink,
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
    MatChipsModule,
  ],
  templateUrl: './client-services.component.html',
  styleUrl: './client-services.component.scss',
})
export class ClientServicesComponent implements OnInit {
  private readonly service = inject(ClientServiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly services = signal<ClientServiceResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly totalElements = signal(0);

  readonly page = signal(0);
  readonly pageSize = signal(20);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly displayedColumns = ['code', 'name', 'description', 'status', 'actions'];

  ngOnInit(): void {
    this.loadServices();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page.set(0);
      this.loadServices();
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadServices();
  }

  loadServices(): void {
    this.loading.set(true);
    this.error.set(null);
    const query = this.searchControl.value.trim() || undefined;
    this.service.list({ query, page: this.page(), size: this.pageSize() }).subscribe({
      next: (pageData) => {
        this.services.set(pageData.content);
        this.totalElements.set(pageData.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os serviços.');
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ClientServiceFormDialogComponent, {
      width: '480px',
      data: null,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.loadServices();
        this.snackBar.open('Serviço criado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }

  openEditDialog(serviceItem: ClientServiceResponse): void {
    const ref = this.dialog.open(ClientServiceFormDialogComponent, {
      width: '480px',
      data: serviceItem,
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadServices();
        this.snackBar.open('Serviço atualizado com sucesso!', 'Fechar', { duration: 3000 });
      }
    });
  }
}
