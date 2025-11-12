import { Component, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { WidgetDashboard } from '../../models/dashboard';
import { DashboardStore } from '../../stores/dashboard.store';

@Component({
  selector: 'lib-widget-options',
  imports: [MatButtonToggleModule, MatIcon, MatButtonModule],
  templateUrl: './widget-options.html',
  styleUrl: './widget-options.scss',
})
export class WidgetOptions {
  data = input.required<WidgetDashboard>();
  showOptions = model.required<boolean>();
  store = inject(DashboardStore);
}
