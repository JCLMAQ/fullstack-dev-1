import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export type Comment = {
  user: string;
  text: string;
};

@Component({
  selector: 'app-latest-comments',
  imports: [MatButtonModule, MatListModule, MatIcon, MatDivider],
  template: `
    <p>Channel comments I haven't responded to</p>

    <mat-list>
      @for (c of comments(); track $index) {
        <mat-list-item lines="2">
          <mat-icon matListItemIcon>account_circle</mat-icon>
          <span matListItemTitle>
            {{ c.user }}
          </span>
          <span matListItemLine>
            {{ c.text }}
          </span>
        </mat-list-item>
        <mat-divider />
      }
    </mat-list>

    <button mat-raised-button class="mt-4">Go to comments</button>
  `,
  styles: ``,
})
export default class LatestCommentsComponent {
  comments = signal<Comment[]>([
    {
      user: 'Ahmed',
      text: 'Nice video! I learnt a lot :) When will you post the next one?',
    },
    {
      user: 'Carlos',
      text: 'Need some details about this...how did you do this exactly?',
    },
    {
      user: 'Gerard',
      text: 'Is this possible to do with angular material? I really need this for my project!',
    },
  ]);
}
