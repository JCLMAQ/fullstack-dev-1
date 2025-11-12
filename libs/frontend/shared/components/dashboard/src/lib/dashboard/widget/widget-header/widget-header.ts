import { Component, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { WidgetDashboard } from '../../models/dashboard';
import { DashboardStore } from '../../stores/dashboard.store';

@Component({
  selector: 'lib-widget-header',
  imports: [MatIcon, MatButtonModule],
  templateUrl: './widget-header.html',
  styleUrl: './widget-header.scss',
})
export class WidgetHeader {
  data = input.required<WidgetDashboard>();
  showOptions = model.required<boolean>();
  store = inject(DashboardStore);
}
