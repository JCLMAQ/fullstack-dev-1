import { Routes } from '@angular/router';
import { FileManagementComponent } from './file-management/file-management';

export const fileRoutes: Routes = [
  {
    path: '',
    component: FileManagementComponent,
    title: 'Gestion des fichiers'
  }
];
