import { Component, ElementRef, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-traffic-sources',
  imports: [MatButtonModule],
  template: `
    <div class="h-[calc(100%-100px)] w-full">
      <canvas #chart></canvas>
    </div>

    <button mat-raised-button class="mt-4">See more</button>
  `,
  styles: ``,
})
export class TrafficSourcesComponent {
  chart = viewChild.required<ElementRef>('chart');

  ngOnInit() {
    new Chart(this.chart().nativeElement, {
      type: 'doughnut',
      data: {
        labels: [
          'Search',
          'Suggested videos',
          'Direct',
          'External',
          'Browse features',
        ],
        datasets: [
          {
            data: [43.6, 25.8, 9.2, 6.2, 5.7],
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
        },
      },
    });
  }
}
