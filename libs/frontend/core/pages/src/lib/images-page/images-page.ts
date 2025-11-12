import { Component } from '@angular/core';
import { ImageManagementComponent } from '@fe/image-mgt';

@Component({
  selector: 'lib-images-page',
  imports: [ImageManagementComponent],
  template: `
    <div class="images-page">
      <lib-image-management
        [showAssociations]="true"
        [showAdminTab]="true">
      </lib-image-management>
    </div>
  `,
  styleUrl: './images-page.scss'
})
export class ImagesPage {}
