import { Injectable, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, from } from 'rxjs';

/*
In this service, we define methods for geolocation using both Observables and Signals.
This approach provides flexibility and better reactivity for geolocation data.
*/

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {

  // Signal-based state management
  private _position = signal<GeolocationPosition | null>(null);
  private _error = signal<string | null>(null);
  private _loading = signal<boolean>(false);

  // Public readonly signals
  readonly position = this._position.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed signals for derived data
  readonly coordinates = computed(() => {
    const pos = this._position();
    return pos ? {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    } : null;
  });

  readonly isGeolocationAvailable = computed(() => 'geolocation' in navigator);

  // Method to get current position and update signals
  async getCurrentPositionAsync(): Promise<void> {
    if (!this.isGeolocationAvailable()) {
      this._error.set('Geolocation is not available in this browser.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const position = await this.getPositionPromise();
      this._position.set(position);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Unknown geolocation error');
    } finally {
      this._loading.set(false);
    }
  }

  // Helper method to promisify geolocation API
  private getPositionPromise(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });
    });
  }

  // Keep the Observable version for backward compatibility
  getCurrentPosition(): Observable<GeolocationPosition> {
    return from(this.getPositionPromise());
  }

  // Signal version using toSignal (alternative approach)
  getCurrentPositionSignal = toSignal(this.getCurrentPosition(), {
    initialValue: null
  });
}



/*
public todos = toSignal(this.todosService.getTodos(), { initialValue: [] });
*/
