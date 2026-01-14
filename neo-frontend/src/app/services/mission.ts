import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Alert {
  id: number;
  message: string;
  timestamp: string;
  name?: string;
  distanceKm?: number;
  velocityKmS?: number;
  diameterM?: number;
  impactEnergy?: number;
  status?: string;
}

export interface ImpactResult {
  id: string;
  name: string;
  distanceKm: number;
  asteroid_size: string;
  impact_energy: string;
  status: 'CATASTROPHIC' | 'MANAGEABLE';
}

export function isDangerous(alert: Alert): boolean {
  if (alert.status) {
    return alert.status === 'CATASTROPHIC';
  }
  if (alert.impactEnergy !== undefined) {
    return alert.impactEnergy > 1000;
  }
  return false;
}

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private alertsUrl = '/api/mission/alerts';
  private impactUrl = '/api/impact/calculate';

  constructor(private http: HttpClient) { }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.alertsUrl).pipe(
      map(alerts => alerts.slice(-10))
    );
  }

  calculateImpact(alert: Alert): Observable<ImpactResult> {
    return this.http.post<ImpactResult>(this.impactUrl, {
      id: alert.id,
      name: alert.name,
      distanceKm: alert.distanceKm,
      velocityKmS: alert.velocityKmS,
      diameterM: alert.diameterM
    });
  }
}