import { } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GeolocationService } from '../geolocation.service';

@Component({
  selector: 'lib-geolocation',
  imports: [],
  templateUrl: './geolocation.component.html',
  styleUrl: './geolocation.component.scss',
})
// According: https://www.notion.so/jclmaq5510/Geolocation-b6e2c6030c4a4a06a674a2cbac8d1d76?pvs=4

/*
This an example how to use the GeolocationService in a component.
*/
export class Geolocation implements OnInit {
  private geolocationService = inject(GeolocationService);

  ngOnInit(): void {
    this.getGeoLocation();
  }

  getGeoLocation() {
    this.geolocationService.getCurrentPosition().subscribe({
      next: (position) => {
        console.log('Latitude:', position.coords.latitude);
        console.log('Longitude:', position.coords.longitude);
      },
      error: (error) => {
        console.error('Error getting geolocation:', error);
      },
    });
  }

  // Usage dans un composant :
async getLocation() {
  await this.geolocationService.getCurrentPositionAsync();
  // Les signals sont automatiquement mis à jour
}

// Dans votre composant :

  // Accès réactif aux données
  position = this.geolocationService.position;
  coordinates = this.geolocationService.coordinates;
  isLoading = this.geolocationService.loading;
  error = this.geolocationService.error;

  async getMyLocation() {
    await this.geolocationService.getCurrentPositionAsync();
  }


}

