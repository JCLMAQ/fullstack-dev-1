import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DashboardStore } from '../stores/dashboard.store';
import { WidgetsPanel } from '../widget/widgets-panel/widgets-panel';

@Component({
  selector: 'lib-dashboard-header',
  imports: [
    MatIcon,
    MatMenuModule,
    MatButtonModule,
    WidgetsPanel,
    CdkDropList,
    CdkDrag,
    MatButtonToggleModule,
  ],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.scss',
})
export class DashboardHeader {
  store = inject(DashboardStore);

  widgetsOpen = signal(false);

  widgetDroppedInPanel(event: CdkDragDrop<number, any>) {
    const { previousContainer } = event;
    this.store.removeWidget(previousContainer.data);
  }
}
