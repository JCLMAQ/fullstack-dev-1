import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Image } from '@db/prisma';
import { TranslateModule } from '@ngx-translate/core';
import { ImageGalleryComponent } from '../image-gallery/image-gallery';
import { ImageUploadManagerComponent } from '../image-upload-manager/image-upload-manager';
import { ImageService, SearchImagesDto } from '../services/image.service';

@Component({
  selector: 'lib-image-management',
  imports: [
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    ImageGalleryComponent,
    ImageUploadManagerComponent
  ],
  templateUrl: './image-management.html',
  styleUrl: './image-management.scss'
})
export class ImageManagementComponent {
  private imageService = inject(ImageService);
  private snackBar = inject(MatSnackBar);

  // Inputs
  showAssociations = input<boolean>(false);
  associationType = input<string>('');
  uploadedById = input<string>('');
  showAdminTab = input<boolean>(false);

  // State
  images = signal<Image[]>([]);
  loading = signal<boolean>(false);
  selectionMode = signal<boolean>(false);
  selectedImages = signal<Image[]>([]);
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
  totalImages = computed(() => this.images().length);
  totalSize = computed(() =>
    this.images().reduce((total, img) => total + img.fileSize, 0)
  );

  displayedImages = computed(() => {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.images().slice(start, end);
  });

  constructor() {
    this.loadImages();
  }

  private async loadImages(): Promise<void> {
    this.loading.set(true);

    try {
      const params: SearchImagesDto = {
        take: 1000, // Charger plus d'images pour la pagination côté client
        orderBy: 'createdAt'
      };

      this.imageService.getImages(params).subscribe({
        next: (images) => {
          this.images.set(images);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des images:', error);
          this.snackBar.open('Erreur lors du chargement des images', 'Fermer', { duration: 3000 });
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
      this.loadImages();
      return;
    }

    this.loading.set(true);
    this.imageService.searchImages(this.searchQuery, {
      mimeType: this.selectedMimeType || undefined,
      isPublic: this.selectedVisibility ?? undefined
    }).subscribe({
      next: (images) => {
        this.images.set(images);
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
    const params: SearchImagesDto = {
      mimeType: this.selectedMimeType || undefined,
      isPublic: this.selectedVisibility ?? undefined,
      take: 1000,
      orderBy: 'createdAt'
    };

    this.loading.set(true);
    this.imageService.getImages(params).subscribe({
      next: (images) => {
        this.images.set(images);
        this.loading.set(false);
        this.currentPage = 0;
      },
      error: (error) => {
        console.error('Erreur lors du filtrage:', error);
        this.loading.set(false);
      }
    });
  }

  refreshImages(): void {
    this.searchQuery = '';
    this.selectedMimeType = '';
    this.selectedVisibility = null;
    this.currentPage = 0;
    this.loadImages();
  }

  toggleSelectionMode(): void {
    this.selectionMode.set(!this.selectionMode());
    if (!this.selectionMode()) {
      this.selectedImages.set([]);
    }
  }

  onImageSelected(): void {
    // Action lors de la sélection d'une image (ex: ouvrir dans un viewer)
  }

  onImageDeleted(image: Image): void {
    const currentImages = this.images();
    const filteredImages = currentImages.filter(img => img.id !== image.id);
    this.images.set(filteredImages);
  }

  onImagesDeleted(deletedImages: Image[]): void {
    const deletedIds = deletedImages.map(img => img.id);
    const currentImages = this.images();
    const filteredImages = currentImages.filter(img => !deletedIds.includes(img.id));
    this.images.set(filteredImages);
    this.selectedImages.set([]);
  }

  onSelectionChanged(selectedImages: Image[]): void {
    this.selectedImages.set(selectedImages);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onFilesUploaded(uploadedImages: Image[]): void {
    const currentImages = this.images();
    this.images.set([...uploadedImages, ...currentImages]);

    // Basculer vers l'onglet galerie pour voir les nouvelles images
    this.activeTab.set(0);
  }

  onUploadProgress(): void {
    // Gérer la progression d'upload si nécessaire
  }

  cleanupUnusedImages(): void {
    // TODO: Implémenter le nettoyage des images non utilisées
    this.snackBar.open('Fonctionnalité de nettoyage à implémenter', 'Fermer', { duration: 3000 });
  }

  findDuplicates(): void {
    // TODO: Implémenter la recherche de doublons
    this.snackBar.open('Recherche de doublons à implémenter', 'Fermer', { duration: 3000 });
  }

  exportImagesList(): void {
    // TODO: Implémenter l'export de la liste
    this.snackBar.open('Export à implémenter', 'Fermer', { duration: 3000 });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
