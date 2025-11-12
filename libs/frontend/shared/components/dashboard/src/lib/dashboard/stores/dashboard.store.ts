import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntities,
  addEntity,
  removeEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { WidgetDashboard } from '../models/dashboard';
import { DashboardService } from '../services/dashboard.service';
import { widgetsDirectory } from '../widget/widgets-directory';

type DashboardState = {
  order: number[];
  settings: {
    mode: 'view' | 'edit';
  };
};

const initialState: DashboardState = {
  order: [],
  settings: { mode: 'view' },
};

export const DashboardStore = signalStore(
  withState(initialState),
  withEntities<WidgetDashboard>(),
  withComputed(({ entities, order, entityMap }) => ({
    widgetsToAdd: computed(() => {
      const addedIds = entities().map((w) => w.id);
      return widgetsDirectory.filter((w) => !addedIds.includes(w.id));
    }),
    addedWidgets: computed(() => {
      return order().map((w) => ({ ...entityMap()[w] }));
    }),
  })),
  withMethods((store, dataService = inject(DashboardService)) => ({
    fetchWidgets() {
      const widgets = dataService.fetchWidgets();
      const order = dataService.fetchOrder();
      patchState(store, addEntities(widgets), { order });
    },
    addWidgetAtPosition(sourceWidgetId: number, destWidgetId: number) {
      const widgetToAdd = widgetsDirectory.find((w) => w.id === sourceWidgetId);

      if (!widgetToAdd) {
        return;
      }

      const indexOfDestWidget = store.order().indexOf(destWidgetId);

      const positionToAdd =
        indexOfDestWidget === -1 ? store.order().length : indexOfDestWidget;
      const order = [...store.order()];
      order.splice(positionToAdd, 0, sourceWidgetId);

      // Add the widget and update the order array
      patchState(store, addEntity({ ...widgetToAdd }), { order });
    },
    updateWidget(id: number, data: Partial<WidgetDashboard>) {
      patchState(store, updateEntity({ id, changes: { ...data } }));
    },
    removeWidget(id: number) {
      patchState(store, removeEntity(id), {
        order: store.order().filter((w) => w !== id),
      });
    },
    updateWidgetPosition(sourceWidgetId: number, targetWidgetId: number) {
      const sourceIndex = store.order().indexOf(sourceWidgetId);

      const order = [...store.order()];
      const removedItem = order.splice(sourceIndex, 1)[0];
      const targetIndex = order.indexOf(targetWidgetId);

      const insertAt =
        sourceIndex === targetIndex ? targetIndex + 1 : targetIndex;

      order.splice(insertAt, 0, removedItem);
      patchState(store, { order });
    },
    setMode(mode: 'view' | 'edit') {
      patchState(store, { settings: { mode } });
    },
    saveWidgets: rxMethod<WidgetDashboard[]>(
      pipe(switchMap((widgets) => dataService.saveWidgets(widgets))),
    ),
    saveOrder: rxMethod<number[]>(
      pipe(switchMap((order) => dataService.saveOrder(order))),
    ),
  })),
  withHooks({
    onInit(store) {
      store.fetchWidgets();
      store.saveWidgets(store.entities);
      store.saveOrder(store.order);
    },
  }),
);
