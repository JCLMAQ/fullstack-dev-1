import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Image } from '@db/prisma';
import { ENVIRONMENT_TOKEN } from '@fe/tokens';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

// Interface pour la réponse du dual-storage controller
interface UploadResponse {
  success: boolean;
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    storageType: string;
    url: string;
  };
}

export interface CreateImageDto {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  thumbnailUrl?: string;
  variants?: Record<string, unknown>;
  tags?: string[];
  altText?: string;
  description?: string;
  sequence?: number;
  isPublic?: boolean;
  uploadedById: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export interface UpdateImageDto {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  thumbnailUrl?: string;
  variants?: unknown;
  tags?: string[];
  altText?: string;
  description?: string;
  sequence?: number;
  isPublic?: boolean;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export interface SearchImagesDto {
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

export interface ImageResponse<T = Image> {
  data: T;
  message: string;
}

export interface ImagesResponse {
  data: Image[];
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
export class ImageService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_TOKEN);

  private readonly baseUrl = `${this.environment.API_BACKEND_URL}/images`;
  private readonly uploadUrl = `${this.environment.API_BACKEND_URL}/dual-storage`;

  // State management
  private imagesSubject = new BehaviorSubject<Image[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public images$ = this.imagesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Core CRUD Operations

  createImage(imageData: CreateImageDto): Observable<Image> {
    this.loadingSubject.next(true);
    return this.http.post<ImageResponse>(`${this.baseUrl}`, imageData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Ajouter la nouvelle image à la liste
        const currentImages = this.imagesSubject.value;
        this.imagesSubject.next([response.data, ...currentImages]);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  getImageById(id: string): Observable<Image | null> {
    return this.http.get<ImageResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(() => of(null))
    );
  }

  getImages(params: SearchImagesDto = {}): Observable<Image[]> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key as keyof SearchImagesDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => httpParams = httpParams.append(key, item.toString()));
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return this.http.get<ImagesResponse>(`${this.baseUrl}`, { params: httpParams }).pipe(
      map(response => {
        this.loadingSubject.next(false);
        this.imagesSubject.next(response.data);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  updateImage(id: string, imageData: UpdateImageDto): Observable<Image> {
    return this.http.put<ImageResponse>(`${this.baseUrl}/${id}`, imageData).pipe(
      map(response => {
        // Mettre à jour l'image dans la liste
        const currentImages = this.imagesSubject.value;
        const updatedImages = currentImages.map(img =>
          img.id === id ? response.data : img
        );
        this.imagesSubject.next(updatedImages);
        return response.data;
      })
    );
  }

  deleteImage(id: string, soft = true): Observable<Image> {
    const params = new HttpParams().set('soft', soft.toString());

    return this.http.delete<ImageResponse>(`${this.baseUrl}/${id}`, { params }).pipe(
      map(response => {
        // Retirer l'image de la liste
        const currentImages = this.imagesSubject.value;
        const filteredImages = currentImages.filter(img => img.id !== id);
        this.imagesSubject.next(filteredImages);
        return response.data;
      })
    );
  }

  // Bulk Operations

  bulkUpdateImages(ids: string[], updates: UpdateImageDto): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/bulk/update`, { ids, updates }).pipe(
      map(response => {
        // Recharger les images
        this.refreshImages();
        return response.count;
      })
    );
  }

  bulkDeleteImages(ids: string[], soft = true): Observable<number> {
    return this.http.delete<BulkResponse>(`${this.baseUrl}/bulk/delete`, {
      body: { ids, soft }
    }).pipe(
      map(response => {
        // Retirer les images supprimées de la liste
        const currentImages = this.imagesSubject.value;
        const filteredImages = currentImages.filter(img => !ids.includes(img.id));
        this.imagesSubject.next(filteredImages);
        return response.count;
      })
    );
  }

  // Search Operations

  searchImages(query: string, filters: SearchImagesDto = {}): Observable<Image[]> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams().set('q', query);
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchImagesDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => httpParams = httpParams.append(key, item.toString()));
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return this.http.get<ImagesResponse>(`${this.baseUrl}/search/query`, { params: httpParams }).pipe(
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

  addTagsToImages(imageIds: string[], tags: string[]): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/tags/add`, { imageIds, tags }).pipe(
      map(response => {
        this.refreshImages();
        return response.count;
      })
    );
  }

  removeTagsFromImages(imageIds: string[], tags: string[]): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/tags/remove`, { imageIds, tags }).pipe(
      map(response => {
        this.refreshImages();
        return response.count;
      })
    );
  }

  getImagesByTags(tags: string[], filters: SearchImagesDto = {}): Observable<Image[]> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchImagesDto];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    const tagsParam = tags.join(',');
    return this.http.get<ImagesResponse>(`${this.baseUrl}/tags/${tagsParam}`, { params: httpParams }).pipe(
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

  associateWithPost(imageIds: string[], postId: string): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/associate/post`, {
      imageIds,
      targetId: postId
    }).pipe(
      map(response => response.count)
    );
  }

  associateWithUser(imageIds: string[], userId: string, asProfile = false): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/associate/user`, {
      imageIds,
      targetId: userId,
      asProfile
    }).pipe(
      map(response => response.count)
    );
  }

  associateWithOrganization(imageIds: string[], orgId: string): Observable<number> {
    return this.http.put<BulkResponse>(`${this.baseUrl}/associate/organization`, {
      imageIds,
      targetId: orgId
    }).pipe(
      map(response => response.count)
    );
  }

  // Metadata Management

  updateImageMetadata(id: string, metadata: { altText?: string; description?: string; tags?: string[] }): Observable<Image> {
    return this.http.put<ImageResponse>(`${this.baseUrl}/${id}/metadata`, metadata).pipe(
      map(response => {
        // Mettre à jour l'image dans la liste
        const currentImages = this.imagesSubject.value;
        const updatedImages = currentImages.map(img =>
          img.id === id ? response.data : img
        );
        this.imagesSubject.next(updatedImages);
        return response.data;
      })
    );
  }

  // Utility Methods

  uploadFile(file: File, metadata: Partial<CreateImageDto>): Observable<Image> {
    const formData = new FormData();
    formData.append('file', file);

    // Mapping des métadonnées vers les champs attendus par le dual-storage controller
    if (metadata.uploadedById) {
      formData.append('ownerId', metadata.uploadedById);
    }
    formData.append('isPublic', 'true'); // Par défaut public

    // Ajout des autres métadonnées optionnelles
    if (metadata.tags && Array.isArray(metadata.tags)) {
      formData.append('tags', metadata.tags.join(','));
    }

    return this.http.post<UploadResponse>(this.uploadUrl, formData).pipe(
      map(response => {
        // Conversion de UploadResponse vers Image
        const imageData: Image = {
          id: response.file.id,
          numSeq: 0, // Sera défini par le serveur
          createdAt: new Date(),
          updatedAt: new Date(),
          published: true,
          isPublic: true,
          isDeleted: 0,
          isDeletedDT: null,
          filename: response.file.filename,
          originalName: response.file.originalName,
          mimeType: response.file.mimeType,
          fileSize: response.file.size,
          width: metadata.width || null,
          height: metadata.height || null,
          storageType: response.file.storageType,
          storagePath: null,
          storageUrl: response.file.url,
          bucketName: null,
          isProcessed: false,
          thumbnailUrl: null,
          variants: null,
          tags: metadata.tags || [],
          altText: null,
          description: null,
          uploadedById: metadata.uploadedById || 'anonymous',
          associatedId: null,
          associationType: null,
          sequence: 0,
          orgId: null,
          postId: null,
          profileUserId: null,
          storyId: null
        };
        return imageData;
      })
    );
  }

  uploadMultipleFiles(files: FileList, metadata: Partial<CreateImageDto>): Observable<Image[]> {
    this.loadingSubject.next(true);
    const formData = new FormData();

    // Ajouter tous les fichiers
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    // Ajouter les métadonnées
    Object.keys(metadata).forEach(key => {
      const value = metadata[key as keyof CreateImageDto];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<{ data: Image[]; count: number; message: string }>(`${this.uploadUrl}/images`, formData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Ajouter les nouvelles images à la liste
        const currentImages = this.imagesSubject.value;
        this.imagesSubject.next([...response.data, ...currentImages]);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  uploadAvatar(file: File, uploadedById: string, profileUserId: string): Observable<Image> {
    this.loadingSubject.next(true);
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('uploadedById', uploadedById);
    formData.append('profileUserId', profileUserId);

    return this.http.post<ImageResponse>(`${this.uploadUrl}/avatar`, formData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Ajouter la nouvelle image à la liste
        const currentImages = this.imagesSubject.value;
        this.imagesSubject.next([response.data, ...currentImages]);
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  refreshImages(): void {
    this.getImages().subscribe();
  }

  clearImages(): void {
    this.imagesSubject.next([]);
  }

  // State getters
  getCurrentImages(): Image[] {
    return this.imagesSubject.value;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
