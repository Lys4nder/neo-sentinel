import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MissionService, Alert, isDangerous } from '../services/mission';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="container">
      <h1>🛡️ Mission Control Dashboard 🛡️</h1>
      
      <div class="connection-status" [class.connected]="sseConnected">
        {{ sseConnected ? 'Live Updates Active' : 'Connecting...' }}
      </div>
      
      <h2>Live Hazard Feed</h2>
      
      <p *ngIf="loading">Loading alerts...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && !error && alerts.length === 0">No alerts at this time.</p>

      <div class="alert-grid">
        <div *ngFor="let alert of alerts" 
             class="alert-card" 
             [class.dangerous]="checkDangerous(alert)"
             [class.safe]="!checkDangerous(alert)"
             [class.new-alert]="alert.isNew">
          <h3>{{ checkDangerous(alert) ? '🚨 COLLISION WARNING' : '✅ MONITORING' }}</h3>
          <p class="message">{{ alert.message }}</p>
          
          <div class="telemetry" *ngIf="alert.diameterM || alert.velocityKmS || alert.distanceKm">
            <span *ngIf="alert.diameterM">📏 {{ alert.diameterM | number:'1.0-0' }}m</span>
            <span *ngIf="alert.velocityKmS">⚡ {{ alert.velocityKmS | number:'1.1-1' }} km/s</span>
            <span *ngIf="alert.distanceKm">📍 {{ alert.distanceKm | number:'1.0-0' }} km</span>
          </div>
          
          <div class="impact-info" *ngIf="alert.impactEnergy !== undefined">
            <strong>Impact Energy:</strong> {{ alert.impactEnergy }} Kilotons
            <span class="status" [class.catastrophic]="alert.status === 'CATASTROPHIC'">
              {{ alert.status }}
            </span>
          </div>
          
          <small>{{ alert.timestamp }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; font-family: sans-serif; max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 10px; }
    h2 { margin-bottom: 20px; }
    
    .connection-status {
      text-align: center;
      padding: 8px;
      margin-bottom: 20px;
      border-radius: 4px;
      background: #ffebee;
      color: #c62828;
      font-weight: 500;
    }
    .connection-status.connected {
      background: #e8f5e9;
      color: #2e7d32;
    }
    
    .alert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
    
    .alert-card { 
      padding: 20px; 
      border-radius: 8px; 
      border-left: 5px solid;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .alert-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    
    .alert-card.new-alert {
      animation: pulse 1s ease-in-out;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
      50% { transform: scale(1.02); box-shadow: 0 0 20px 10px rgba(255, 193, 7, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
    }
    
    .alert-card.dangerous { 
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); 
      border-color: #ef5350; 
    }
    .alert-card.dangerous h3 { color: #c62828; }
    
    .alert-card.safe { 
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); 
      border-color: #4caf50; 
    }
    .alert-card.safe h3 { color: #2e7d32; }
    
    .alert-card h3 { margin: 0 0 10px 0; font-size: 1.1em; }
    .message { margin: 10px 0; font-weight: 500; }
    
    .telemetry { 
      display: flex; 
      gap: 15px; 
      margin: 12px 0; 
      font-size: 0.9em; 
      color: #555;
      flex-wrap: wrap;
    }
    
    .impact-info { 
      background: rgba(0,0,0,0.05); 
      padding: 10px; 
      border-radius: 4px; 
      margin: 10px 0;
      font-size: 0.9em;
    }
    
    .status { 
      display: inline-block;
      margin-left: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85em;
    }
    .status.catastrophic { background: #ef5350; color: white; }
    .status:not(.catastrophic) { background: #4caf50; color: white; }
    
    small { display: block; margin-top: 10px; color: #777; }
    .error { color: #d32f2f; text-align: center; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  alerts: (Alert & { isNew?: boolean })[] = [];
  loading = true;
  error: string | null = null;
  sseConnected = false;
  
  private sseSubscription?: Subscription;

  constructor(
    private missionService: MissionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load existing alerts first
    this.loadAlerts();
    
    // Subscribe to real-time SSE stream
    this.subscribeToAlertStream();
  }
  
  ngOnDestroy() {
    this.sseSubscription?.unsubscribe();
  }
  
  subscribeToAlertStream() {
    this.sseSubscription = this.missionService.getAlertStream().subscribe({
      next: (alert) => {
        this.sseConnected = true;
        
        // Check if alert already exists
        const exists = this.alerts.some(a => a.id === alert.id);
        if (!exists) {
          // Add new alert at the beginning with animation flag
          const newAlert = { ...alert, isNew: true };
          this.alerts.unshift(newAlert);
          
          // Keep only last 10 alerts
          if (this.alerts.length > 10) {
            this.alerts.pop();
          }
          
          // Calculate impact for new alert
          this.calculateImpactForAlert(newAlert);
          
          // Remove animation class after 1 second
          setTimeout(() => {
            newAlert.isNew = false;
            this.cdr.detectChanges();
          }, 1000);
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('SSE error:', err);
        this.sseConnected = false;
        this.cdr.detectChanges();
        
        // Reconnect after 5 seconds
        setTimeout(() => this.subscribeToAlertStream(), 5000);
      }
    });
  }

  loadAlerts() {
    this.missionService.getAlerts().subscribe({
      next: data => {
        this.alerts = data.reverse(); // Most recent first
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
        
        this.calculateImpacts();
      },
      error: err => {
        this.loading = false;
        this.error = 'Failed to load alerts. Is backend running?';
        this.cdr.detectChanges();
      }
    });
  }

  calculateImpacts() {
    const alertsWithTelemetry = this.alerts.filter(
      a => a.diameterM && a.velocityKmS && a.impactEnergy === undefined
    );
    
    if (alertsWithTelemetry.length === 0) return;
    
    const requests = alertsWithTelemetry.map(alert => 
      this.missionService.calculateImpact(alert)
    );
    
    forkJoin(requests).subscribe({
      next: results => {
        results.forEach((result, index) => {
          const alert = alertsWithTelemetry[index];
          const energyMatch = result.impact_energy.match(/([\d.]+)/);
          alert.impactEnergy = energyMatch ? parseFloat(energyMatch[1]) : 0;
          alert.status = result.status;
        });
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to calculate impacts:', err);
      }
    });
  }
  
  calculateImpactForAlert(alert: Alert & { isNew?: boolean }) {
    if (!alert.diameterM || !alert.velocityKmS) return;
    
    this.missionService.calculateImpact(alert).subscribe({
      next: result => {
        const energyMatch = result.impact_energy.match(/([\d.]+)/);
        alert.impactEnergy = energyMatch ? parseFloat(energyMatch[1]) : 0;
        alert.status = result.status;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to calculate impact:', err);
      }
    });
  }

  checkDangerous(alert: Alert): boolean {
    return isDangerous(alert);
  }
}