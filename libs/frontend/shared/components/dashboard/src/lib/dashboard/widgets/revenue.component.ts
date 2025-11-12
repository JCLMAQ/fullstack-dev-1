import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-revenue',
  imports: [MatIcon],
  template: `
    <div class="flex items-center gap-2 mb-1">
      <p class="text-2xl">$55.90</p>
      <mat-icon class="text-[#03C03C]">arrow_circle_up</mat-icon>
    </div>

    <div class="text-sm">
      <span class="text-[#03C03C]">$20</span>
      <span> more than usual </span>
    </div>
  `,
  styles: ``,
})
export class RevenueComponent {}
