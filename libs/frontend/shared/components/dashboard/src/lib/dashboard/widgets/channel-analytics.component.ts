import {
  Component,
  effect,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LoadingContainer } from '@fe/loading-container';
import Chart from 'chart.js/auto';

@Component({
  selector: 'lib-channel-analytics',
  imports: [MatButtonModule, LoadingContainer],
  template: `
    <!-- <div class="h-[calc(100%-100px)] w-full">
      <canvas #chart></canvas>
    </div> -->

    <lib-loading-container
      [loading]="loading()"
      class="h-[calc(100%-100px)] w-full"
    >
      <canvas #chart></canvas>
    </lib-loading-container>

    <button mat-raised-button class="mt-4">Go to channel analytics</button>
  `,
  styles: ``,
})
export default class ChannelAnalyticsComponent {
  chart = viewChild.required<ElementRef>('chart');

  loading = signal(false);

  ngOnInit() {
    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);
    }, 2000);
  }

  renderChart = effect(() => {
    const chart = this.chart();
    if (!chart) return;

    new Chart(this.chart().nativeElement, {
      type: 'line',
      data: {
        labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
        datasets: [
          {
            label: 'Views',
            data: [100, 102, 105, 110, 115, 120],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgb(255, 99, 132, 0.5)',
            fill: 'start',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        elements: {
          line: {
            tension: 0.4,
          },
        },
      },
    });
  });
}
