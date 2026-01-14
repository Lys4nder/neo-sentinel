import { Injectable, NgZone } from '@angular/core';
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
  private alertsStreamUrl = '/api/mission/alerts/stream';
  private impactUrl = '/api/impact/calculate';

  constructor(private http: HttpClient, private ngZone: NgZone) { }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.alertsUrl).pipe(
      map(alerts => alerts.slice(-10))
    );
  }

  getAlertStream(): Observable<Alert> {
    return new Observable(observer => {
      const eventSource = new EventSource(this.alertsStreamUrl);
      
      eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const alert = JSON.parse(event.data) as Alert;
            observer.next(alert);
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        });
      };
      
      eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('SSE connection error:', error);
        });
      };
      
      return () => {
        eventSource.close();
      };
    });
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
