import { Component, computed, inject, input } from '@angular/core';
import { AppStore } from '@fe/stores';

@Component({
  selector: 'lib-sidenav-header',
  imports: [],
  templateUrl: './sidenav-header.html',
  styleUrl: './sidenav-header.scss',
})
export class SidenavHeader {
  collapsed = input(false);

  appStore = inject(AppStore);

  profilePicSize = computed(() => (this.collapsed() ? '32' : '100'));
}
