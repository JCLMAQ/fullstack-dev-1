import { Route } from '@angular/router';


export const appRoutes: Route[] = [

  { path: '',
    loadChildren: () => import('@fe/layout').then(m => m.layoutRoutes) }
];
