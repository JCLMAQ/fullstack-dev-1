import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Image } from '@db/prisma';
import { TranslateModule } from '@ngx-translate/core';
import { ImageService } from '../services/image.service';

interface FileData {
  file: File;
  preview: string;
  dimensions?: { width: number; height: number };
  uploading?: boolean;
  progress?: number;
}

@Component({
  selector: 'lib-image-upload-manager',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    DecimalPipe,
    TranslateModule
  ],
  templateUrl: './image-upload-manager.html',
  styleUrl: './image-upload-manager.scss'
})
export class ImageUploadManagerComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private imageService = inject(ImageService);

  // Inputs
  multiple = input<boolean>(true);
  associationType = input<string>('');
  showAssociations = input<boolean>(false);
  acceptedTypes = input<string>('image/*');
  maxFileSize = input<number>(10 * 1024 * 1024); // 10MB
  uploadedById = input<string>('');

  // Outputs
  filesUploaded = output<Image[]>();
  uploadProgress = output<number>();

  // ViewChild
  fileInput = viewChild<ElementRef>('fileInput');

  // State
  selectedFiles = signal<FileData[]>([]);
  isDragOver = signal<boolean>(false);
  uploading = signal<boolean>(false);
  overallProgress = signal<number>(0);
  tags = signal<string[]>([]);

  // Form
  metadataForm: FormGroup;

  constructor() {
    this.metadataForm = this.fb.group({
      altText: [''],
      description: [''],
      storageType: ['local', Validators.required],
      isPublic: [false],
      postId: [''],
      profileUserId: [''],
      orgId: ['']
    });
  }

  trackByFileName(index: number, fileData: FileData): string {
    return fileData.file.name;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = Array.from(event.dataTransfer?.files || []);
    this.processFiles(files);
  }

  openFileDialog(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.processFiles(files);
  }

  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => this.validateFile(file));

    if (validFiles.length !== files.length) {
      const invalidCount = files.length - validFiles.length;
      this.snackBar.open(
        `${invalidCount} fichier(s) ignoré(s) (type ou taille non valide)`,
        'Fermer',
        { duration: 3000 }
      );
    }

    validFiles.forEach(file => this.addFile(file));
  }

  private validateFile(file: File): boolean {
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      return false;
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize()) {
      return false;
    }

    return true;
  }

  private addFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      const preview = e.target?.result as string;

      // Obtenir les dimensions de l'image
      const img = new Image();
      img.onload = () => {
        const fileData: FileData = {
          file,
          preview,
          dimensions: { width: img.width, height: img.height },
          uploading: false,
          progress: 0
        };

        const currentFiles = this.selectedFiles();
        if (!this.multiple() && currentFiles.length > 0) {
          this.selectedFiles.set([fileData]);
        } else {
          this.selectedFiles.set([...currentFiles, fileData]);
        }
      };
      img.src = preview;
    };

    reader.readAsDataURL(file);
  }

  removeFile(fileName: string): void {
    const currentFiles = this.selectedFiles();
    const filteredFiles = currentFiles.filter(fileData => fileData.file.name !== fileName);
    this.selectedFiles.set(filteredFiles);
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
    this.overallProgress.set(0);
  }

  addTag(event: { value: string; chipInput: { clear(): void } }): void {
    const value = event.value?.trim();
    if (value) {
      const currentTags = this.tags();
      if (!currentTags.includes(value)) {
        this.tags.set([...currentTags, value]);
      }
    }
    event.chipInput.clear();
  }

  addTagFromInput(input: HTMLInputElement): void {
    const value = input.value?.trim();
    if (value) {
      const currentTags = this.tags();
      if (!currentTags.includes(value)) {
        this.tags.set([...currentTags, value]);
      }
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const currentTags = this.tags();
    const filteredTags = currentTags.filter(t => t !== tag);
    this.tags.set(filteredTags);
  }

  async uploadFiles(): Promise<void> {
    if (this.selectedFiles().length === 0 || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    const uploadedImages: Image[] = [];
    const totalFiles = this.selectedFiles().length;
    let completedFiles = 0;

    const formData = this.metadataForm.value;
    const tags = this.tags();

    try {
      for (const fileData of this.selectedFiles()) {
        // Marquer ce fichier comme en cours d'upload
        fileData.uploading = true;
        fileData.progress = 0;

        const metadata = {
          ...formData,
          filename: fileData.file.name,
          originalName: fileData.file.name,
          mimeType: fileData.file.type,
          fileSize: fileData.file.size,
          width: fileData.dimensions?.width,
          height: fileData.dimensions?.height,
          tags: tags.length > 0 ? tags : undefined,
          uploadedById: this.uploadedById() || 'anonymous'
        };

        try {
          const uploadedImage = await this.imageService.uploadFile(fileData.file, metadata).toPromise();

          if (uploadedImage) {
            uploadedImages.push(uploadedImage);
            fileData.progress = 100;
          }
        } catch (error) {
          console.error(`Erreur upload ${fileData.file.name}:`, error);
          this.snackBar.open(
            `Erreur lors de l'upload de ${fileData.file.name}`,
            'Fermer',
            { duration: 3000 }
          );
        }

        completedFiles++;
        const progress = (completedFiles / totalFiles) * 100;
        this.overallProgress.set(progress);
        this.uploadProgress.emit(progress);
      }

      if (uploadedImages.length > 0) {
        this.filesUploaded.emit(uploadedImages);
        this.snackBar.open(
          `${uploadedImages.length} image(s) uploadée(s) avec succès`,
          'Fermer',
          { duration: 3000 }
        );

        // Nettoyer après succès
        this.clearFiles();
        this.resetForm();
      }

    } finally {
      this.uploading.set(false);
      this.overallProgress.set(0);
    }
  }

  private resetForm(): void {
    this.metadataForm.reset({
      storageType: 'local',
      isPublic: false
    });
    this.tags.set([]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
