import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-views',
  imports: [MatIcon],
  template: `
    <div class="flex items-center gap-2 mb-1">
      <p class="text-2xl">43,500</p>
      <mat-icon class="text-[#03C03C]">check_circle_outline</mat-icon>
    </div>

    <div class="text-sm">
      <span class="text-[#03C03C]">+2020</span>
      <span> in the last 28 days </span>
    </div>
  `,
  styles: ``,
})
export class ViewsComponent {}
