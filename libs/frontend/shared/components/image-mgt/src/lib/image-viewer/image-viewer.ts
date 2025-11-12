import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { Image } from '@db/prisma';
import { TranslateModule } from '@ngx-translate/core';

export interface ImageViewerData {
  image: Image;
  images?: Image[];
}

@Component({
  selector: 'lib-image-viewer',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatIconButton,
    MatIcon,
    MatTooltip,
    MatProgressSpinner,
    MatChipSet,
    MatChip,
    DatePipe,
    TranslateModule
  ],
  template: `
    <div class="image-viewer">
      <!-- Header avec actions -->
      <div class="viewer-header" mat-dialog-title>
        <div class="image-title">
          <h2>{{ currentImage().originalName }}</h2>
          <p class="image-details">
            {{ formatFileSize(currentImage().fileSize) }}
            @if (currentImage().width && currentImage().height) {
              <span>
                • {{ currentImage().width }}x{{ currentImage().height }}
              </span>
            }
            @if (currentImage().mimeType) {
              <span>
                • {{ currentImage().mimeType }}
              </span>
            }
          </p>
        </div>

        <div class="viewer-actions">
          <!-- Navigation si plusieurs images -->
          @if (hasMultipleImages()) {
            <div class="navigation">
              <button mat-icon-button
                      (click)="previousImage()"
                      [disabled]="currentIndex() === 0"
                      matTooltip="{{ 'IMAGE_VIEWER.PREVIOUS' | translate }}">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="image-counter">{{ currentIndex() + 1 }} / {{ totalImages() }}</span>
              <button mat-icon-button
                      (click)="nextImage()"
                      [disabled]="currentIndex() === totalImages() - 1"
                      matTooltip="{{ 'IMAGE_VIEWER.NEXT' | translate }}">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          }

          <!-- Actions sur l'image -->
          <button mat-icon-button
                  (click)="downloadImage()"
                  matTooltip="{{ 'IMAGE_VIEWER.DOWNLOAD' | translate }}">
            <mat-icon>download</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="copyImageUrl()"
                  matTooltip="{{ 'IMAGE_VIEWER.COPY_URL' | translate }}">
            <mat-icon>link</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="toggleZoom()"
                  matTooltip="{{ isZoomed() ? ('IMAGE_VIEWER.ZOOM_OUT' | translate) : ('IMAGE_VIEWER.ZOOM_IN' | translate) }}">
            <mat-icon>{{ isZoomed() ? 'zoom_out' : 'zoom_in' }}</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="deleteImage()"
                  color="warn"
                  matTooltip="{{ 'IMAGE_VIEWER.DELETE' | translate }}">
            <mat-icon>delete</mat-icon>
          </button>

          <button mat-icon-button
                  mat-dialog-close
                  matTooltip="{{ 'IMAGE_VIEWER.CLOSE' | translate }}">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Contenu de l'image -->
      <div class="viewer-content" mat-dialog-content>
        <div class="image-container"
             [class.zoomed]="isZoomed()"
             (click)="toggleZoom()"
             (keyup.enter)="toggleZoom()"
             (keyup.space)="toggleZoom()"
             tabindex="0"
             role="button"
             [attr.aria-label]="isZoomed() ? ('IMAGE_VIEWER.ZOOM_OUT' | translate) : ('IMAGE_VIEWER.ZOOM_IN' | translate)">

          <!-- Chargement -->
          @if (imageLoading()) {
            <div class="loading-overlay">
              <mat-progress-spinner diameter="50"></mat-progress-spinner>
            </div>
          }

          <!-- Image principale -->
          <img
            [src]="currentImage().storageUrl || '/assets/images/placeholder.png'"
            [alt]="currentImage().altText || currentImage().originalName"
            class="main-image"
            [class.zoomed]="isZoomed()"
            (load)="onImageLoad()"
            (error)="onImageError($event)"
            (click)="$event.stopPropagation()"
            (keyup.enter)="$event.stopPropagation()"
            (keyup.space)="$event.stopPropagation()"
            tabindex="0"
          />
        </div>
      </div>

      <!-- Footer avec métadonnées -->
      <div class="viewer-footer" mat-dialog-actions>
        <div class="image-metadata">
                    <!-- Description -->
          @if (currentImage().description) {
            <div class="metadata-item">
              <strong>{{ 'IMAGE_VIEWER.DESCRIPTION' | translate }}:</strong>
              {{ currentImage().description }}
            </div>
          }

          <!-- Texte alternatif -->
          @if (currentImage().altText) {
            <div class="metadata-item">
              <strong>{{ 'IMAGE_VIEWER.ALT_TEXT' | translate }}:</strong>
              {{ currentImage().altText }}
            </div>
          }

          <!-- Tags -->
          @if (currentImage().tags && currentImage().tags.length > 0) {
            <div class="metadata-item">
              <strong>{{ 'IMAGE_VIEWER.TAGS' | translate }}:</strong>
              <div class="tags-container">
                <mat-chip-set>
                  @for (tag of currentImage().tags; track tag) {
                    <mat-chip>{{ tag }}</mat-chip>
                  }
                </mat-chip-set>
              </div>
            </div>
          }

          <!-- Dates -->
          <div class="metadata-dates">
            <div class="metadata-item">
              <strong>{{ 'IMAGE_VIEWER.UPLOADED' | translate }}:</strong>
              <span>{{ formatDate(currentImage().createdAt) }}</span>
            </div>
                        <div class="date-info">
              <strong>{{ 'IMAGE_VIEWER.CREATED_AT' | translate }}:</strong>
              {{ currentImage().createdAt | date : 'medium' }}
            </div>
            @if (currentImage().updatedAt !== currentImage().createdAt) {
              <div class="metadata-item">
                <strong>{{ 'IMAGE_VIEWER.UPDATED_AT' | translate }}:</strong>
                {{ currentImage().updatedAt | date : 'medium' }}
              </div>
            }
          </div>

          <!-- Statut -->
          <div class="metadata-item">
            <strong>{{ 'IMAGE_VIEWER.STATUS' | translate }}:</strong>
            <span [class]="currentImage().isPublic ? 'public' : 'private'">
              {{ currentImage().isPublic ? ('IMAGE_VIEWER.PUBLIC' | translate) : ('IMAGE_VIEWER.PRIVATE' | translate) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './image-viewer.scss'
})
export class ImageViewerComponent {
  private dialogRef = inject(MatDialogRef<ImageViewerComponent>);
  private data = inject<ImageViewerData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  // State
  currentIndex = signal(0);
  isZoomed = signal(false);
  imageLoading = signal(true);

  // Data
  images = signal<Image[]>(this.data.images || [this.data.image]);

  // Computed
  currentImage = signal<Image>(this.data.image);
  totalImages = signal(this.images().length);
  hasMultipleImages = signal(this.images().length > 1);

  constructor() {
    // Trouver l'index de l'image actuelle
    const initialIndex = this.images().findIndex(img => img.id === this.data.image.id);
    if (initialIndex !== -1) {
      this.currentIndex.set(initialIndex);
    }

    // Écouter les touches du clavier
    this.setupKeyboardNavigation();
  }

  private setupKeyboardNavigation(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.previousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.nextImage();
          break;
        case 'Escape':
          event.preventDefault();
          this.dialogRef.close();
          break;
        case 'Delete':
          event.preventDefault();
          this.deleteImage();
          break;
        case ' ':
          event.preventDefault();
          this.toggleZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    // Nettoyage lors de la fermeture
    this.dialogRef.afterClosed().subscribe(() => {
      document.removeEventListener('keydown', handleKeyPress);
    });
  }

  previousImage(): void {
    if (this.currentIndex() > 0) {
      const newIndex = this.currentIndex() - 1;
      this.currentIndex.set(newIndex);
      this.currentImage.set(this.images()[newIndex]);
      this.imageLoading.set(true);
      this.isZoomed.set(false);
    }
  }

  nextImage(): void {
    if (this.currentIndex() < this.totalImages() - 1) {
      const newIndex = this.currentIndex() + 1;
      this.currentIndex.set(newIndex);
      this.currentImage.set(this.images()[newIndex]);
      this.imageLoading.set(true);
      this.isZoomed.set(false);
    }
  }

  toggleZoom(): void {
    this.isZoomed.set(!this.isZoomed());
  }

  downloadImage(): void {
    const image = this.currentImage();
    if (image.storageUrl) {
      const link = document.createElement('a');
      link.href = image.storageUrl;
      link.download = image.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.snackBar.open('Téléchargement démarré', 'Fermer', { duration: 2000 });
    }
  }

  copyImageUrl(): void {
    const image = this.currentImage();
    if (image.storageUrl) {
      navigator.clipboard.writeText(image.storageUrl).then(() => {
        this.snackBar.open('URL copiée dans le presse-papiers', 'Fermer', { duration: 2000 });
      }).catch(() => {
        this.snackBar.open('Erreur lors de la copie', 'Fermer', { duration: 2000 });
      });
    }
  }

  deleteImage(): void {
    const dialogRef = this.snackBar.open(
      `Supprimer "${this.currentImage().originalName}" ?`,
      'Confirmer',
      { duration: 5000 }
    );

    dialogRef.onAction().subscribe(() => {
      this.dialogRef.close({
        action: 'delete',
        image: this.currentImage()
      });
    });
  }

  onImageLoad(): void {
    this.imageLoading.set(false);
  }

  onImageError(event: Event): void {
    this.imageLoading.set(false);
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

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }
}
