import { Route } from '@angular/router';
import { Home } from './home/home';
import { ImagesPage } from './images-page/images-page';
import { PageNotFound } from './page-not-found/page-not-found';

export const pagesRoutes: Route[] = [
  { path: 'home', component: Home },
  { path: 'picture', component: ImagesPage },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'page-not-found', component: PageNotFound },
  { path: '**', component: PageNotFound },
];
