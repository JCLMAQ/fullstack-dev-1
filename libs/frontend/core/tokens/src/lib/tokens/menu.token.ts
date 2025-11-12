import { InjectionToken } from '@angular/core';
import { MenuItems } from '../models/menu-items.model';

export const MENU_ITEMS_TOKEN = new InjectionToken<MenuItems[]>('MENU_ITEMS');
