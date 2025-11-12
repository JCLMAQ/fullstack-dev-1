import { Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { MENU_ITEMS_TOKEN, MenuItems } from '@fe/tokens';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'lib-menu-item',
  imports: [
    RouterModule,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.scss',
})
export class MenuItem {
  public menuItems = inject(MENU_ITEMS_TOKEN);

  item = input.required<MenuItems>();
  collapsed = input.required<boolean>();
  routeHistory = input('');

  level = computed(() => this.routeHistory().split('/').length - 1);
  indentation = computed(() =>
    this.collapsed() ? '16px' : `${16 + this.level() * 16}px`,
  );

  nestedItemOpen = signal(false);
}
