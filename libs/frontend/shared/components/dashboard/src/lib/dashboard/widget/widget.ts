import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { WidgetDashboard } from '../models/dashboard';
import { DashboardStore } from '../stores/dashboard.store';
import { WidgetHeader } from './widget-header/widget-header';
import { WidgetOptions } from './widget-options/widget-options';

@Component({
  selector: 'lib-widget',
  imports: [
    WidgetHeader,
    WidgetOptions,
    NgComponentOutlet,
    CdkDrag,
    CdkDragPlaceholder,
  ],
  templateUrl: './widget.html',
  styleUrl: './widget.scss',
  host: {
    '[style.grid-area]': 'gridArea()',
    class: 'block rounded-2xl',
  },
})
export class Widget {
  data = input.required<WidgetDashboard>();

  store = inject(DashboardStore);

  showOptions = signal(false);

  gridArea = computed(() => {
    const rows = this.data().rows ?? 1;
    const columns = this.data().columns ?? 1;
    return `span ${rows} / span ${columns}`;
  });
}
