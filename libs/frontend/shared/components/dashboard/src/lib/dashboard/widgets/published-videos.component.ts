import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { YouTubePlayer } from '@angular/youtube-player';

export type Video = {
  id: string;
  snippet: {
    thumbnails: {
      standard: {
        url: string;
      };
    };
    description: string;
    publishedAt: string;
    title: string;
  };
};

@Component({
  selector: 'app-published-videos',
  imports: [YouTubePlayer, DatePipe, MatButtonModule],
  template: `
    @for (video of videos(); track video.id) {
      <div class="flex gap-6 mb-3">
        @defer (on interaction) {
          <youtube-player
            [playerVars]="{ autoplay: 1 }"
            [width]="100"
            [height]="50"
            [videoId]="video.id"
          />
        } @placeholder {
          <div class="cursor-pointer">
            <img
              class="min-w-[100px] h-[50px] rounded-2xl object-cover"
              [src]="video.snippet.thumbnails.standard.url"
            />
          </div>
        }
        <div>
          <h4 class="text-sm">{{ video.snippet.title }}</h4>
          <p class="text-xs text-slate-500">
            {{ video.snippet.publishedAt | date }}
          </p>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-top: 32px;
    }

    youtube-player ::ng-deep .youtube-player-placeholder {
      border-radius: 16px;
    }
  `,
})
export class PublishedVideosComponent {
  videoIds = [
    'Irf4aZC3LPY',
    'MtTAfjiZxtk',
    'I13uAoOGU_4',
    // 'plQJIgD2rl8',
    // 'vHNeAqgNM4o',
    // 'h6-BhzFD1CM',
  ];

  videos = signal<Video[]>([]);

  async ngOnInit() {
    const videoIdsEncoded = encodeURIComponent(this.videoIds.join(','));
    const key = 'AIzaSyDd_1H0TuWt40lkkhU-F46wrPNxgdeFYow'; //Add your youtube API key here
    const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${videoIdsEncoded}&key=${key}`;

    const response = await fetch(url);
    const result = await response.json();
    this.videos.set(result.items);
  }
}
