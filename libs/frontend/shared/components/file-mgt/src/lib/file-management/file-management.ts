import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { File } from '@db/prisma';
import { TranslateModule } from '@ngx-translate/core';
import { FileService, SearchFilesDto } from '../services/file.service';

@Component({
  selector: 'lib-file-management',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './file-management.html',
  styleUrl: './file-management.scss'
})
export class FileManagementComponent {
  protected fileService = inject(FileService);
  private snackBar = inject(MatSnackBar);

  // Inputs
  showAssociations = input<boolean>(false);
  associationType = input<string>('');
  uploadedById = input<string>('');
  showAdminTab = input<boolean>(false);

  // State
  files = signal<File[]>([]);
  loading = signal<boolean>(false);
  selectionMode = signal<boolean>(false);
  selectedFiles = signal<File[]>([]);
  activeTab = signal<number>(0);

  // Search & Filters
  searchQuery = '';
  selectedMimeType = '';
  selectedVisibility: boolean | null = null;
  viewMode = 'gallery';

  // Pagination
  currentPage = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];

  // Computed
  totalFiles = computed(() => this.files().length);
  totalSize = computed(() =>
    this.files().reduce((total, file) => total + file.fileSize, 0)
  );

  displayedFiles = computed(() => {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.files().slice(start, end);
  });

  constructor() {
    this.loadFiles();
  }

  private async loadFiles(): Promise<void> {
    this.loading.set(true);

    try {
      const params: SearchFilesDto = {
        take: 1000, // Charger plus de fichiers pour la pagination côté client
        orderBy: 'createdAt'
      };

      this.fileService.getFiles(params).subscribe({
        next: (files) => {
          this.files.set(files);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des fichiers:', error);
          this.snackBar.open('Erreur lors du chargement des fichiers', 'Fermer', { duration: 3000 });
          this.loading.set(false);
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      this.loading.set(false);
    }
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadFiles();
      return;
    }

    this.loading.set(true);
    this.fileService.searchFiles(this.searchQuery, {
      mimeType: this.selectedMimeType || undefined,
      isPublic: this.selectedVisibility ?? undefined
    }).subscribe({
      next: (files) => {
        this.files.set(files);
        this.loading.set(false);
        this.currentPage = 0;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.snackBar.open('Erreur lors de la recherche', 'Fermer', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    const params: SearchFilesDto = {
      mimeType: this.selectedMimeType || undefined,
      isPublic: this.selectedVisibility ?? undefined,
      take: 1000,
      orderBy: 'createdAt'
    };

    this.loading.set(true);
    this.fileService.getFiles(params).subscribe({
      next: (files) => {
        this.files.set(files);
        this.loading.set(false);
        this.currentPage = 0;
      },
      error: (error) => {
        console.error('Erreur lors du filtrage:', error);
        this.loading.set(false);
      }
    });
  }

  refreshFiles(): void {
    this.searchQuery = '';
    this.selectedMimeType = '';
    this.selectedVisibility = null;
    this.currentPage = 0;
    this.loadFiles();
  }

  toggleSelectionMode(): void {
    this.selectionMode.set(!this.selectionMode());
    if (!this.selectionMode()) {
      this.selectedFiles.set([]);
    }
  }

  // Méthodes pour l'upload et la sélection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    }
  }

  onFileDeleted(file: File): void {
    const currentFiles = this.files();
    const filteredFiles = currentFiles.filter(f => f.id !== file.id);
    this.files.set(filteredFiles);
  }

  onFilesDeleted(deletedFiles: File[]): void {
    const deletedIds = deletedFiles.map(f => f.id);
    const currentFiles = this.files();
    const filteredFiles = currentFiles.filter(f => !deletedIds.includes(f.id));
    this.files.set(filteredFiles);
    this.selectedFiles.set([]);
  }

  onSelectionChanged(selectedFiles: File[]): void {
    this.selectedFiles.set(selectedFiles);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onFilesUploaded(uploadedFiles: File[]): void {
    const currentFiles = this.files();
    this.files.set([...uploadedFiles, ...currentFiles]);

    // Basculer vers l'onglet galerie pour voir les nouveaux fichiers
    this.activeTab.set(0);
  }

  onUploadProgress(): void {
    // Gérer la progression d'upload si nécessaire
  }

  cleanupUnusedFiles(): void {
    // TODO: Implémenter le nettoyage des fichiers non utilisés
    this.snackBar.open('Fonctionnalité de nettoyage à implémenter', 'Fermer', { duration: 3000 });
  }

  findDuplicates(): void {
    // TODO: Implémenter la recherche de doublons
    this.snackBar.open('Recherche de doublons à implémenter', 'Fermer', { duration: 3000 });
  }

  exportFilesList(): void {
    // TODO: Implémenter l'export de la liste
    this.snackBar.open('Export à implémenter', 'Fermer', { duration: 3000 });
  }

  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  // Méthodes pour les actions de fichiers
  toggleFileSelection(file: File): void {
    const selectedFiles = this.selectedFiles();
    const index = selectedFiles.findIndex(f => f.id === file.id);

    if (index > -1) {
      // Retirer de la sélection
      selectedFiles.splice(index, 1);
      this.selectedFiles.set([...selectedFiles]);
    } else {
      // Ajouter à la sélection
      this.selectedFiles.set([...selectedFiles, file]);
    }
  }

  downloadFile(file: File): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement:', error);
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  editFile(file: File): void {
    // TODO: Implémenter l'édition des métadonnées du fichier
    console.log('Édition du fichier:', file);
    this.snackBar.open('Édition à implémenter', 'Fermer', { duration: 3000 });
  }

  deleteFile(file: File): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.onFileDeleted(file);
          this.snackBar.open('Fichier supprimé avec succès', 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Méthodes pour l'upload
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  private processFiles(files: globalThis.File[]): void {
    // Pour l'instant, on traite les fichiers un par un
    files.forEach(file => {
      const metadata = {
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        uploadedById: this.uploadedById() || 'anonymous',
        isPublic: false
      };

      this.fileService.uploadFile(file, metadata).subscribe({
        next: (uploadedFile) => {
          this.onFilesUploaded([uploadedFile]);
          this.snackBar.open(`Fichier ${file.name} uploadé avec succès`, 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          console.error(`Erreur upload ${file.name}:`, error);
          this.snackBar.open(`Erreur lors de l'upload de ${file.name}`, 'Fermer', { duration: 3000 });
        }
      });
    });
  }
}
