import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DashboardStore } from '../../stores/dashboard.store';

@Component({
  selector: 'lib-widgets-panel',
  imports: [MatListModule, MatIcon, CdkDrag, CdkDragPlaceholder],
  templateUrl: './widgets-panel.html',
  styleUrl: './widgets-panel.scss',
})
export class WidgetsPanel {
  store = inject(DashboardStore);
}
