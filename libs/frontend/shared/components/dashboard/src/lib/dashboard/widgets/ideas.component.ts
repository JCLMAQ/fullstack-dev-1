import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ideas',
  imports: [MatButtonModule],
  template: `
    <h4 class="text-lg mb-2">How videos get discovered</h4>

    <p class="text-slate-500">
      Learn how YouTube's search and discovery system works and what actions you
      can take to help your videos reach more viewers
    </p>

    <button mat-raised-button class="mt-16">Start now</button>
  `,
  styles: `
    :host {
      font-size: 0.9rem;
    }
  `,
})
export class IdeasComponent {}
