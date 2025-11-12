import { Component } from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-latest-video',
  imports: [YouTubePlayer, MatButton],
  template: `
    <youtube-player width="250" height="150" videoId="Irf4aZC3LPY" />
    <button mat-raised-button class="mt-4">Go to video analytics</button>
  `,
  styles: `
    youtube-player ::ng-deep .youtube-player-placeholder {
      border-radius: 16px;
    }
  `,
})
export default class LatestVideoComponent {}
