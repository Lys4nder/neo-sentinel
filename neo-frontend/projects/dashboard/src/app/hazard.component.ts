import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MissionService, Alert, isDangerous, StreamEvent } from './services/mission.service';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-hazard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2>✅ Manageable Hazards</h2>
        <div class="connection-status" [class.connected]="sseConnected">
          <span class="status-dot"></span>
          {{ sseConnected ? 'Live Updates Active' : 'Connecting...' }}
        </div>
      </div>
      
      <div class="stats-bar">
        <div class="stat-card safe">
          <span class="stat-value">{{ alerts.length }}</span>
          <span class="stat-label">Monitored Objects</span>
        </div>
      </div>
      
      <h3 class="section-title">Non-Critical Hazard Monitoring</h3>
      
      <p *ngIf="loading" class="loading">Loading hazards...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && !error && alerts.length === 0" class="empty">No manageable hazards detected.</p>

      <div class="alert-grid">
        <div *ngFor="let alert of alerts" 
             class="alert-card safe">
          <div class="alert-header">
            <h4>✅ MONITORING</h4>
            <span class="alert-id">#{{ alert.id }}</span>
          </div>
          <p class="message">{{ alert.message }}</p>
          
          <div class="telemetry" *ngIf="alert.diameterM || alert.velocityKmS || alert.distanceKm">
            <div class="telemetry-item" *ngIf="alert.diameterM">
              <span class="telemetry-icon">📏</span>
              <span class="telemetry-value">{{ alert.diameterM | number:'1.0-0' }}m</span>
            </div>
            <div class="telemetry-item" *ngIf="alert.velocityKmS">
              <span class="telemetry-icon">⚡</span>
              <span class="telemetry-value">{{ alert.velocityKmS | number:'1.1-1' }} km/s</span>
            </div>
            <div class="telemetry-item" *ngIf="alert.distanceKm">
              <span class="telemetry-icon">📍</span>
              <span class="telemetry-value">{{ alert.distanceKm | number:'1.0-0' }} km</span>
            </div>
          </div>
          
          <div class="impact-info" *ngIf="alert.impactEnergy !== undefined">
            <div class="impact-energy">
              <strong>Impact Energy:</strong> {{ alert.impactEnergy }} Kilotons
            </div>
            <span class="status-badge">
              {{ alert.status }}
            </span>
          </div>
          
          <small class="timestamp">{{ alert.timestamp }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0;
      font-family: 'Segoe UI', sans-serif;
      color: #e0e0e0;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .dashboard-header h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #4caf50;
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(255, 82, 82, 0.2);
      color: #ff5252;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    .connection-status.connected {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .stats-bar {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 32px;
      max-width: 300px;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stat-card.safe {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.3);
    }
    
    .stat-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 700;
      color: #4caf50;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: #999;
      margin-top: 4px;
    }
    
    .section-title {
      font-size: 1.2rem;
      margin-bottom: 16px;
      color: #bbb;
    }
    
    .loading, .empty {
      color: #888;
      font-style: italic;
      padding: 40px;
      text-align: center;
    }
    
    .error {
      color: #ff5252;
      background: rgba(255, 82, 82, 0.1);
      padding: 16px;
      border-radius: 8px;
    }
    
    .alert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .alert-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
    }
    
    .alert-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .alert-card.safe {
      border-color: rgba(76, 175, 80, 0.4);
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
    }
    
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .alert-header h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #4caf50;
      margin: 0;
    }
    
    .alert-id {
      font-size: 0.8rem;
      color: #666;
      font-family: monospace;
    }
    
    .message {
      color: #ccc;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    
    .telemetry {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    }
    
    .telemetry-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .telemetry-icon {
      font-size: 1.1rem;
    }
    
    .telemetry-value {
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #64b5f6;
    }
    
    .impact-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .impact-energy {
      font-size: 0.9rem;
      color: #81c784;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }
    
    .timestamp {
      display: block;
      color: #666;
      font-size: 0.8rem;
      text-align: right;
    }
  `]
})
export class HazardComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  loading = true;
  error = '';
  sseConnected = false;
  private sseSubscription?: Subscription;

  constructor(
    private missionService: MissionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.subscribeToAlertStream();
  }

  ngOnDestroy(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  loadAlerts(): void {
    this.missionService.getAlerts().subscribe({
      next: (alerts) => {
        // Process ALL alerts first, then filter for manageable ones after impact calculation
        this.processAlerts(alerts);
      },
      error: (err) => {
        this.error = 'Failed to load hazards: ' + (err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  processAlerts(alerts: Alert[]): void {
    const alertsWithTelemetry = alerts.filter(a => a.diameterM && a.velocityKmS && a.distanceKm);
    const impactRequests = alertsWithTelemetry.map(alert => this.missionService.calculateImpact(alert));

    if (impactRequests.length > 0) {
      forkJoin(impactRequests).subscribe({
        next: (results) => {
          alertsWithTelemetry.forEach(alert => {
            const result = results.find(r => r.id === String(alert.id));
            if (result) {
              alert.impactEnergy = parseFloat(result.impact_energy);
              alert.status = result.status;
            }
          });
          // Filter for MANAGEABLE/safe alerts after impact calculation
          this.alerts = alertsWithTelemetry.filter(a => !isDangerous(a));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Impact calculation failed:', err);
          this.alerts = [];
          this.loading = false;
        }
      });
    } else {
      this.alerts = [];
      this.loading = false;
    }
  }

  subscribeToAlertStream(): void {
    this.sseSubscription = this.missionService.getAlertStream().subscribe({
      next: (event: StreamEvent) => {
        if (event.type === 'connected') {
          this.sseConnected = true;
          this.cdr.detectChanges();
          return;
        }
        
        if (event.type === 'disconnected') {
          this.sseConnected = false;
          this.cdr.detectChanges();
          return;
        }
        
        if (event.type === 'alert' && event.alert) {
          const alert = event.alert;
          if (alert.diameterM && alert.velocityKmS && alert.distanceKm) {
            this.processNewAlert(alert);
          }
        }
      },
      error: () => {
        this.sseConnected = false;
        this.cdr.detectChanges();
      }
    });
  }

  processNewAlert(alert: Alert): void {
    if (alert.diameterM && alert.velocityKmS && alert.distanceKm) {
      this.missionService.calculateImpact(alert).subscribe({
        next: (result) => {
          alert.impactEnergy = parseFloat(result.impact_energy);
          alert.status = result.status;
          // Only add if still manageable after impact calculation
          if (!isDangerous(alert)) {
            this.addAlertToList(alert);
          }
        },
        error: () => {
          this.addAlertToList(alert);
        }
      });
    } else {
      this.addAlertToList(alert);
    }
  }

  addAlertToList(alert: Alert): void {
    const existingIndex = this.alerts.findIndex(a => a.id === alert.id);
    if (existingIndex >= 0) {
      this.alerts[existingIndex] = alert;
    } else {
      this.alerts.unshift(alert);
    }
    this.cdr.detectChanges();
  }
}
