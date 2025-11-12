import { Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'lib-loading-container',
  imports: [
    MatProgressSpinner
  ],
  templateUrl: './loading-container.html',
  styleUrl: './loading-container.scss',
})
export class LoadingContainer {

  loading = input<boolean>(false);
  size = input<number>(40);

}
