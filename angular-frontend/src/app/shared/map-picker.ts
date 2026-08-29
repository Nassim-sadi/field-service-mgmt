import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-picker',
  template: `<div class="overflow-hidden rounded-md border" style="height: 250px;" #mapEl></div>`,
})
export class MapPickerComponent implements AfterViewInit {
  readonly lat = input<number | null>(null);
  readonly lng = input<number | null>(null);
  readonly latLngChange = output<{ lat: number; lng: number }>();

  readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('mapEl');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngAfterViewInit(): void {
    const el = this.mapEl()?.nativeElement;
    if (!el) return;
    const hasPos = typeof this.lat() === 'number' && typeof this.lng() === 'number';
    const center: L.LatLngExpression = hasPos ? [this.lat() as number, this.lng() as number] : [28.0339, 1.6596];
    const zoom = hasPos ? 10 : 5;
    this.map = L.map(el).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latLngChange.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      this.updateMarker(e.latlng.lat, e.latlng.lng);
    });

    if (hasPos) this.updateMarker(this.lat() as number, this.lng() as number);
  }

  private updateMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (!this.marker) {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.latLngChange.emit({ lat: pos.lat, lng: pos.lng });
      });
    } else {
      this.marker.setLatLng([lat, lng]);
    }
    this.map.setView([lat, lng], this.map.getZoom());
  }
}
