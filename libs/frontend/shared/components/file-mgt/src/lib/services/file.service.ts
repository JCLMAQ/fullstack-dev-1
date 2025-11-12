import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { File } from '@db/prisma';
import { ENVIRONMENT_TOKEN } from '@fe/tokens';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

export interface CreateFileDto {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
  uploadedById: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export interface UpdateFileDto {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  metadata?: unknown;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export interface SearchFilesDto {
  query?: string;
  uploadedById?: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
  mimeType?: string;
  tags?: string[];
  isPublic?: boolean;
  storageType?: string;
  createdAfter?: string;
  createdBefore?: string;
  skip?: number;
  take?: number;
  orderBy?: string;
}

export interface FileResponse<T = File> {
  data: T;
  message: string;
}

export interface FilesResponse {
  data: File[];
  total: number;
  message: string;
}

export interface BulkResponse {
  count: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_TOKEN);

  private readonly baseUrl = `${this.environment.API_BACKEND_URL}/files`;
  private readonly uploadUrl = `${this.environment.API_BACKEND_URL}/upload`;

  // State management
  private filesSubject = new BehaviorSubject<File[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public files$ = this.filesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Core CRUD Operations

  createFile(fileData: CreateFileDto): Observable<File> {
    this.loadingSubject.next(true);
    return this.http.post<FileResponse>(`${this.baseUrl}`, fileData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Ajouter le nouveau fichier à la liste
        const currentFiles = this.filesSubject.value;
        this.filesSubject.next([response.data, ...currentFiles]);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  getFileById(id: string): Observable<File | null> {
    return this.http.get<FileResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(() => of(null))
    );
  }

  getFiles(params: SearchFilesDto = {}): Observable<File[]> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key as keyof SearchFilesDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => httpParams = httpParams.append(key, item.toString()));
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return this.http.get<FilesResponse>(`${this.baseUrl}`, { params: httpParams }).pipe(
      map(response => {
        this.loadingSubject.next(false);
        this.filesSubject.next(response.data);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  updateFile(id: string, fileData: UpdateFileDto): Observable<File> {
    return this.http.put<FileResponse>(`${this.baseUrl}/${id}`, fileData).pipe(
      map(response => {
        // Mettre à jour le fichier dans la liste
        const currentFiles = this.filesSubject.value;
        const updatedFiles = currentFiles.map(file =>
          file.id === id ? response.data : file
        );
        this.filesSubject.next(updatedFiles);
        return response.data;
      })
    );
  }

  deleteFile(id: string, soft = true): Observable<File> {
    const params = new HttpParams().set('soft', soft.toString());

    return this.http.delete<FileResponse>(`${this.baseUrl}/${id}`, { params }).pipe(
      map(response => {
        // Retirer le fichier de la liste
        const currentFiles = this.filesSubject.value;
        const filteredFiles = currentFiles.filter(file => file.id !== id);
        this.filesSubject.next(filteredFiles);
        return response.data;
      })
    );
  }

  // Bulk Operations

  bulkUpdateFiles(ids: string[], updates: UpdateFileDto): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/bulk/update`, { ids, updates }).pipe(
      map(response => {
        // Recharger les fichiers
        this.refreshFiles();
        return response.count;
      })
    );
  }

  bulkDeleteFiles(ids: string[], soft = true): Observable<number> {
    return this.http.delete<BulkResponse>(`${this.baseUrl}/bulk/delete`, {
      body: { ids, soft }
    }).pipe(
      map(response => {
        // Retirer les fichiers supprimés de la liste
        const currentFiles = this.filesSubject.value;
        const filteredFiles = currentFiles.filter(file => !ids.includes(file.id));
        this.filesSubject.next(filteredFiles);
        return response.count;
      })
    );
  }

  // Search Operations

  searchFiles(query: string, filters: SearchFilesDto = {}): Observable<File[]> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams().set('q', query);
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchFilesDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => httpParams = httpParams.append(key, item.toString()));
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return this.http.get<FilesResponse>(`${this.baseUrl}/search/query`, { params: httpParams }).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  // Tag Management

  addTagsToFiles(fileIds: string[], tags: string[]): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/tags/add`, { fileIds, tags }).pipe(
      map(response => {
        this.refreshFiles();
        return response.count;
      })
    );
  }

  removeTagsFromFiles(fileIds: string[], tags: string[]): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/tags/remove`, { fileIds, tags }).pipe(
      map(response => {
        this.refreshFiles();
        return response.count;
      })
    );
  }

  getFilesByTags(tags: string[], filters: SearchFilesDto = {}): Observable<File[]> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchFilesDto];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    const tagsParam = tags.join(',');
    return this.http.get<FilesResponse>(`${this.baseUrl}/tags/${tagsParam}`, { params: httpParams }).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  // Association Management

  associateWithPost(fileIds: string[], postId: string): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/associate/post`, {
      fileIds,
      targetId: postId
    }).pipe(
      map(response => response.count)
    );
  }

  associateWithUser(fileIds: string[], userId: string): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/associate/user`, {
      fileIds,
      targetId: userId
    }).pipe(
      map(response => response.count)
    );
  }

  associateWithOrganization(fileIds: string[], orgId: string): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/associate/organization`, {
      fileIds,
      targetId: orgId
    }).pipe(
      map(response => response.count)
    );
  }

  // File Download

  downloadFile(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download`, { responseType: 'blob' });
  }

  // Utility Methods

  uploadFile(file: globalThis.File, metadata: Partial<CreateFileDto>): Observable<File> {
    this.loadingSubject.next(true);
    const formData = new FormData();
    formData.append('file', file);

    // Ajouter les métadonnées en tant que string pour Multer
    Object.keys(metadata).forEach(key => {
      const value = metadata[key as keyof CreateFileDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Pour les tags, joindre avec des virgules
          formData.append(key, value.join(','));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<FileResponse>(`${this.uploadUrl}/file`, formData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Ajouter le nouveau fichier à la liste
        const currentFiles = this.filesSubject.value;
        this.filesSubject.next([response.data, ...currentFiles]);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  uploadMultipleFiles(files: FileList, metadata: Partial<CreateFileDto>): Observable<File[]> {
    this.loadingSubject.next(true);
    const formData = new FormData();

    // Ajouter tous les fichiers
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    // Ajouter les métadonnées
    Object.keys(metadata).forEach(key => {
      const value = metadata[key as keyof CreateFileDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<{ data: File[]; count: number; message: string }>(`${this.uploadUrl}/files`, formData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Ajouter les nouveaux fichiers à la liste
        const currentFiles = this.filesSubject.value;
        this.filesSubject.next([...response.data, ...currentFiles]);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  refreshFiles(): void {
    this.getFiles().subscribe();
  }

  clearFiles(): void {
    this.filesSubject.next([]);
  }

  // State getters
  getCurrentFiles(): File[] {
    return this.filesSubject.value;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Utility functions for file handling
  getMimeTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video_file';
    if (mimeType.startsWith('audio/')) return 'audio_file';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('doc')) return 'article';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table_chart';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slideshow';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'folder_zip';
    if (mimeType.includes('text')) return 'text_snippet';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
