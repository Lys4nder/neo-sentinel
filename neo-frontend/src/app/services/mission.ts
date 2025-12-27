import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Alert {
  id: number;
  message: string;
  timestamp: string;
}

export interface ImpactResult {
  asteroid_size: string;
  impact_energy: string;
  status: string;
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

  calculateImpact(velocity: number, diameter: number): Observable<ImpactResult> {
    return this.http.post<ImpactResult>(this.impactUrl, { 
      velocity: velocity, 
      diameter: diameter 
    });
  }
}