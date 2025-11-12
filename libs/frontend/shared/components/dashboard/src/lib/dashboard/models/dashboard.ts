import { Type } from '@angular/core';

export type WidgetDashboard = {
  id: number;
  label: string;
  content: Type<unknown>;
  rows?: number;
  columns?: number;
  backgroundColor?: string;
  color?: string;
};
