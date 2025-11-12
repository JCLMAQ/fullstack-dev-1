import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Image } from '@db/prisma';
import { TranslateModule } from '@ngx-translate/core';
import { ImageViewerComponent } from '../image-viewer/image-viewer';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'lib-image-gallery',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss'
})
export class ImageGalleryComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private imageService = inject(ImageService);

  // Inputs
  images = input<Image[]>([]);
  selectionMode = input<boolean>(false);
  showActions = input<boolean>(true);
  loading = input<boolean>(false);

  // Outputs
  imageSelected = output<Image>();
  imageDeleted = output<Image>();
  imagesDeleted = output<Image[]>();
  selectionChanged = output<Image[]>();

  // State
  selectedImages = signal<Image[]>([]);

  // Computed
  selectedImageIds = computed(() => this.selectedImages().map(img => img.id));

  trackByImageId(index: number, image: Image): string {
    return image.id;
  }

  hasSelectedImages(): boolean {
    return this.selectedImages().length > 0;
  }

  getSelectedCount(): number {
    return this.selectedImages().length;
  }

  isSelected(imageId: string): boolean {
    return this.selectedImageIds().includes(imageId);
  }

  onImageClick(image: Image): void {
    if (this.selectionMode()) {
      this.toggleSelection(image);
    } else {
      this.viewImage(image);
    }
  }

  toggleSelection(image: Image): void {
    const currentSelection = this.selectedImages();
    const isCurrentlySelected = this.isSelected(image.id);

    if (isCurrentlySelected) {
      const newSelection = currentSelection.filter(img => img.id !== image.id);
      this.selectedImages.set(newSelection);
    } else {
      this.selectedImages.set([...currentSelection, image]);
    }

    this.selectionChanged.emit(this.selectedImages());
  }

  selectAll(): void {
    this.selectedImages.set([...this.images()]);
    this.selectionChanged.emit(this.selectedImages());
  }

  clearSelection(): void {
    this.selectedImages.set([]);
    this.selectionChanged.emit([]);
  }

  deselectAll(): void {
    this.clearSelection();
  }

  downloadSelected(): void {
    const selectedImages = this.selectedImages();
    if (selectedImages.length === 0) {
      this.snackBar.open('Aucune image sélectionnée', 'Fermer', { duration: 2000 });
      return;
    }

    selectedImages.forEach((image, index) => {
      const url = image.storageUrl;
      if (url) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = url;
          link.download = image.originalName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 100); // Délai pour éviter de bloquer le navigateur
      }
    });

    this.snackBar.open(
      `Téléchargement de ${selectedImages.length} image(s) en cours...`,
      'Fermer',
      { duration: 3000 }
    );
  }

  viewImage(image: Image, event?: Event): void {
    event?.stopPropagation();

    const dialogRef = this.dialog.open(ImageViewerComponent, {
      data: {
        image,
        images: this.images()
      },
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'image-viewer-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'delete') {
        this.deleteImage(result.image);
      }
    });
  }

  editImage(): void {
    // TODO: Ouvrir le dialogue d'édition
    this.snackBar.open('Fonctionnalité d\'édition à implémenter', 'Fermer', { duration: 3000 });
  }

  downloadImage(image: Image): void {
    if (image.storageUrl) {
      const link = document.createElement('a');
      link.href = image.storageUrl;
      link.download = image.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  copyImageUrl(image: Image): void {
    if (image.storageUrl) {
      navigator.clipboard.writeText(image.storageUrl).then(() => {
        this.snackBar.open('URL copiée dans le presse-papiers', 'Fermer', { duration: 2000 });
      });
    }
  }

  deleteImage(image: Image): void {
    const dialogRef = this.snackBar.open(
      `Supprimer "${image.originalName}" ?`,
      'Confirmer',
      { duration: 5000 }
    );

    dialogRef.onAction().subscribe(() => {
      this.imageService.deleteImage(image.id).subscribe({
        next: () => {
          this.imageDeleted.emit(image);
          this.snackBar.open('Image supprimée avec succès', 'Fermer', { duration: 2000 });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    });
  }

  deleteSelected(): void {
    const selectedCount = this.selectedImages().length;
    const dialogRef = this.snackBar.open(
      `Supprimer ${selectedCount} image(s) sélectionnée(s) ?`,
      'Confirmer',
      { duration: 5000 }
    );

    dialogRef.onAction().subscribe(() => {
      const selectedIds = this.selectedImageIds();

      this.imageService.bulkDeleteImages(selectedIds).subscribe({
        next: () => {
          this.imagesDeleted.emit(this.selectedImages());
          this.clearSelection();
          this.snackBar.open(`${selectedCount} image(s) supprimée(s) avec succès`, 'Fermer', { duration: 2000 });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression en lot:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    });
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/assets/images/placeholder.png';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
