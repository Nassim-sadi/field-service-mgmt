import { AfterViewInit, Component, ElementRef, effect, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import * as L from 'leaflet';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  AvgResolution,
  DashboardStats,
  OverTimeRow,
  Paginated,
  PartsConsumption,
  Site,
  Sla,
  Technician,
  WorkloadRow,
} from '../../core/api/types';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  PageHeaderComponent,
  SkeletonComponent,
} from '../../shared/ui';

const statusColors: Record<string, string> = {
  new: '#3b82f6',
  assigned: '#6366f1',
  accepted: '#a855f7',
  in_progress: '#f59e0b',
  completed: '#10b981',
};

const barOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 12 } }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0, font: { size: 12 } } },
  },
};

const horizontalBarOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0, font: { size: 12 } } },
    y: { ticks: { font: { size: 12 } }, grid: { display: false } },
  },
};

const doughnutOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
};

const techIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const siteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    PageHeaderComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    SkeletonComponent,
    BaseChartDirective,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Dashboard" description="Field service overview"></app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        @for (card of statCards; track card.label) {
          <app-card>
            <app-card-header class="pb-2">
              <app-card-title class="text-sm font-medium text-muted-foreground">{{ card.label }}</app-card-title>
            </app-card-header>
            <app-card-content>
              @if (stats.isLoading()) {
                <app-skeleton width="3rem" height="2rem"></app-skeleton>
              } @else {
                <div class="text-3xl font-semibold">{{ card.value() ?? 0 }}</div>
              }
            </app-card-content>
          </app-card>
        }
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <app-card>
          <app-card-header>
            <app-card-title>Workload by technician</app-card-title>
          </app-card-header>
          <app-card-content class="h-72">
            <div class="h-72">
              <canvas baseChart [data]="workloadData()" [options]="barOptions" type="bar"></canvas>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-header>
            <app-card-title>Orders by status</app-card-title>
          </app-card-header>
          <app-card-content class="h-72">
            <div class="h-72">
              <canvas baseChart [data]="overTimeData()" [options]="doughnutOptions" type="doughnut"></canvas>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-header>
            <app-card-title>SLA</app-card-title>
          </app-card-header>
          <app-card-content class="space-y-3">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div>
                <div class="text-2xl font-semibold">{{ sla.isLoading() ? '…' : (sla.data()?.open_orders ?? 0) }}</div>
                <div class="text-xs text-muted-foreground">Open</div>
              </div>
              <div>
                <div class="text-2xl font-semibold">{{ sla.isLoading() ? '…' : (sla.data()?.on_time ?? 0) }}</div>
                <div class="text-xs text-muted-foreground">On time</div>
              </div>
              <div>
                <div class="text-2xl font-semibold">{{ sla.isLoading() ? '…' : (sla.data()?.breaches ?? 0) }}</div>
                <div class="text-xs text-muted-foreground">Breaches</div>
              </div>
            </div>
            @if (avgRes.data()?.avg_resolution_minutes != null) {
              <div class="rounded-lg bg-muted p-3 text-center">
                <div class="text-2xl font-semibold">{{ Math.round(avgRes.data()!.avg_resolution_minutes!) }} min</div>
                <div class="text-sm text-muted-foreground">Average resolution time</div>
              </div>
            }
          </app-card-content>
        </app-card>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <app-card>
          <app-card-header>
            <app-card-title>Parts consumption</app-card-title>
          </app-card-header>
          <app-card-content class="h-72">
            <div class="h-72">
              <canvas baseChart [data]="partsData()" [options]="horizontalBarOptions" type="bar"></canvas>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-header>
            <div class="flex items-center justify-between gap-2">
              <app-card-title>Field map</app-card-title>
              <div class="flex items-center gap-3 text-xs">
                <label class="flex items-center gap-1.5">
                  <input type="checkbox" [checked]="showTechs()" (change)="showTechs.set(!showTechs())" />
                  <span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Technicians
                </label>
                <label class="flex items-center gap-1.5">
                  <input type="checkbox" [checked]="showSites()" (change)="showSites.set(!showSites())" />
                  <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span> Sites
                </label>
              </div>
            </div>
          </app-card-header>
          <app-card-content class="h-72 overflow-hidden rounded-md">
            <div class="h-72 w-full" #mapContainer></div>
          </app-card-content>
        </app-card>
      </div>
    </div>
  `,
})
export class DashboardComponent implements AfterViewInit {
  protected readonly barOptions = barOptions;
  protected readonly horizontalBarOptions = horizontalBarOptions;
  protected readonly doughnutOptions = doughnutOptions;

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private techLayer: L.LayerGroup | null = null;
  private siteLayer: L.LayerGroup | null = null;

  protected showTechs = signal(true);
  protected showSites = signal(true);

  protected stats = injectQuery(() => ({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => lastValueFrom(this.api.get<DashboardStats>('/dashboard/stats/')),
  }));
  protected workload = injectQuery(() => ({
    queryKey: ['dashboard', 'workload'],
    queryFn: () => lastValueFrom(this.api.get<WorkloadRow[]>('/dashboard/workload/')),
  }));
  protected sla = injectQuery(() => ({
    queryKey: ['dashboard', 'sla'],
    queryFn: () => lastValueFrom(this.api.get<Sla>('/dashboard/sla/')),
  }));
  protected avgRes = injectQuery(() => ({
    queryKey: ['dashboard', 'avgResolution'],
    queryFn: () => lastValueFrom(this.api.get<AvgResolution>('/dashboard/avg_resolution/')),
  }));
  protected parts = injectQuery(() => ({
    queryKey: ['dashboard', 'partsConsumption'],
    queryFn: () => lastValueFrom(this.api.get<PartsConsumption[]>('/dashboard/parts_consumption/')),
  }));
  protected overTime = injectQuery(() => ({
    queryKey: ['dashboard', 'overTime'],
    queryFn: () => lastValueFrom(this.api.get<OverTimeRow[]>('/dashboard/over_time/')),
  }));
  protected technicians = injectQuery(() => ({
    queryKey: ['technicians'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Technician>>('/technicians/')),
  }));
  protected sites = injectQuery(() => ({
    queryKey: ['sites'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Site>>('/sites/')),
  }));

  readonly Map = Map;
  readonly Math = Math;

  constructor(private api: ApiService) {
    effect(() => {
      const techs = this.technicians.data()?.results ?? [];
      const sites = this.sites.data()?.results ?? [];
      const showTechs = this.showTechs();
      const showSites = this.showSites();
      if (this.map) {
        this.renderMarkers(techs, sites, showTechs, showSites);
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.mapContainer()?.nativeElement;
    if (!el) return;
    this.map = L.map(el).setView([28.0339, 1.6596], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    this.techLayer = L.layerGroup().addTo(this.map);
    this.siteLayer = L.layerGroup().addTo(this.map);
    const techs = this.technicians.data()?.results ?? [];
    const sites = this.sites.data()?.results ?? [];
    this.renderMarkers(techs, sites, this.showTechs(), this.showSites());
  }

  private renderMarkers(techs: Technician[], sites: Site[], showTechs: boolean, showSites: boolean): void {
    if (!this.map || !this.techLayer || !this.siteLayer) return;
    this.techLayer.clearLayers();
    this.siteLayer.clearLayers();
    if (showTechs) {
      techs
        .filter((tech) => tech.latitude != null && tech.longitude != null)
        .forEach((tech) => {
          L.marker([Number(tech.latitude), Number(tech.longitude)], { icon: techIcon })
            .addTo(this.techLayer!)
            .bindPopup(
              `<div class="text-sm"><div class="font-medium">${tech.full_name || tech.username}</div><div>${tech.specialty ?? ''}</div><div>${tech.open_work_orders} open order(s)</div></div>`,
            );
        });
    }
    if (showSites) {
      sites
        .filter((site) => site.latitude != null && site.longitude != null)
        .forEach((site) => {
          L.marker([Number(site.latitude), Number(site.longitude)], { icon: siteIcon })
            .addTo(this.siteLayer!)
            .bindPopup(
              `<div class="text-sm"><div class="font-medium">${site.name}</div><div>${site.address ?? ''}</div></div>`,
            );
        });
    }
  }

  get statCards(): { label: string; value: () => number | undefined }[] {
    const s = this.stats.data();
    return [
      { label: 'Open tickets', value: () => s?.open_tickets },
      { label: 'In progress', value: () => s?.in_progress },
      { label: 'Completed', value: () => s?.completed },
      { label: 'Technicians', value: () => s?.technicians },
      { label: 'Overdue', value: () => s?.overdue },
    ];
  }

  workloadData(): ChartData {
    const rows = this.workload.data() ?? [];
    return {
      labels: rows.map((r) => r.technician),
      datasets: [
        { data: rows.map((r) => r.count), backgroundColor: '#0ea5e9', borderRadius: 4 },
      ],
    };
  }

  overTimeData(): ChartData {
    const rows = this.overTime.data() ?? [];
    return {
      labels: rows.map((r) => r.status),
      datasets: [
        {
          data: rows.map((r) => r.count),
          backgroundColor: rows.map((r) => statusColors[r.status] ?? '#94a3b8'),
        },
      ],
    };
  }

  partsData(): ChartData {
    const rows = this.parts.data() ?? [];
    return {
      labels: rows.map((p) => p.part),
      datasets: [
        { data: rows.map((p) => p.quantity), backgroundColor: '#8b5cf6', borderRadius: 4 },
      ],
    };
  }
}
