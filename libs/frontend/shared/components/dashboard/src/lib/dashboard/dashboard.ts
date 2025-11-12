import {
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
} from '@angular/core';
import { AppStore } from '@fe/stores';
import { ResponsiveService } from '@fe/tokens';
import { wrapGrid } from 'animate-css-grid';
import { Chart } from 'chart.js/auto';
import { DashboardHeader } from './dashboard-header/dashboard-header';
import { DashboardStore } from './stores/dashboard.store';
import { Widget } from './widget/widget';

@Component({
  selector: 'lib-dashboard',
  imports: [Widget, DashboardHeader, CdkDropList, CdkDropListGroup],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [DashboardStore],
})
export class Dashboard implements OnInit, OnDestroy {
  appStore = inject(AppStore);

  reponsiveService = inject(ResponsiveService);

  dashboard = viewChild.required<ElementRef>('dashboard');

  store = inject(DashboardStore);
  clearAnimations = () => {};

  ngOnInit() {
    const { unwrapGrid } = wrapGrid(this.dashboard().nativeElement, {
      duration: 300,
    });
    this.clearAnimations = unwrapGrid;

    Chart.defaults.color = 'gray';
  }

  ngOnDestroy() {
    this.clearAnimations();
  }

  drop(event: CdkDragDrop<number, any>) {
    const {
      previousContainer,
      container,
      item: { data },
    } = event;

    if (data) {
      this.store.addWidgetAtPosition(data, container.data);
      return;
    }

    this.store.updateWidgetPosition(previousContainer.data, container.data);
  }
}
