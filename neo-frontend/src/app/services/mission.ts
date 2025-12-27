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
  // Calculated fields from impact-function
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

// Determine if asteroid is dangerous based on status or distance
export function isDangerous(alert: Alert): boolean {
  if (alert.status) {
    return alert.status === 'CATASTROPHIC' || (alert.distanceKm !== undefined && alert.distanceKm < 40000);
  }
  return alert.distanceKm !== undefined && alert.distanceKm < 40000;
}

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private alertsUrl = 'http://localhost:8080/api/mission/alerts';
  private impactUrl = 'http://localhost:8080/api/impact/calculate';

  constructor(private http: HttpClient) { }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.alertsUrl).pipe(
      map(alerts => alerts.slice(-5))
    );
  }

  calculateImpact(alert: Alert): Observable<ImpactResult> {
    return this.http.post<ImpactResult>(this.impactUrl, {
      velocity: alert.velocityKmS,
      diameter: alert.diameterM
    });
  }
}