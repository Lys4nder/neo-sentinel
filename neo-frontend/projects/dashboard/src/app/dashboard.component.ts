import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MissionService, Alert, isDangerous } from './services/mission.service';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2>🛡️ Mission Control Dashboard</h2>
        <div class="connection-status" [class.connected]="sseConnected">
          <span class="status-dot"></span>
          {{ sseConnected ? 'Live Updates Active' : 'Connecting...' }}
        </div>
      </div>
      
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-value">{{ alerts.length }}</span>
          <span class="stat-label">Total Alerts</span>
        </div>
        <div class="stat-card danger">
          <span class="stat-value">{{ dangerousCount }}</span>
          <span class="stat-label">Critical Threats</span>
        </div>
        <div class="stat-card safe">
          <span class="stat-value">{{ safeCount }}</span>
          <span class="stat-label">Monitored</span>
        </div>
      </div>
      
      <h3 class="section-title">Live Hazard Feed</h3>
      
      <p *ngIf="loading" class="loading">Loading alerts...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && !error && alerts.length === 0" class="empty">No alerts at this time.</p>

      <div class="alert-grid">
        <div *ngFor="let alert of alerts" 
             class="alert-card" 
             [class.dangerous]="checkDangerous(alert)"
             [class.safe]="!checkDangerous(alert)"
             [class.new-alert]="alert.isNew">
          <div class="alert-header">
            <h4>{{ checkDangerous(alert) ? '🚨 COLLISION WARNING' : '✅ MONITORING' }}</h4>
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
            <span class="status-badge" [class.catastrophic]="alert.status === 'CATASTROPHIC'">
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
      color: #fff;
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
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stat-card.danger {
      background: rgba(255, 82, 82, 0.1);
      border-color: rgba(255, 82, 82, 0.3);
    }
    
    .stat-card.safe {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.3);
    }
    
    .stat-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
    }
    
    .stat-card.danger .stat-value { color: #ff5252; }
    .stat-card.safe .stat-value { color: #4caf50; }
    
    .stat-label {
      display: block;
      font-size: 0.85rem;
      color: #888;
      margin-top: 4px;
    }
    
    .section-title {
      font-size: 1.2rem;
      margin-bottom: 16px;
      color: #aaa;
    }
    
    .loading, .error, .empty {
      text-align: center;
      padding: 40px;
      color: #888;
    }
    
    .error { color: #ff5252; }
    
    .alert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }
    
    .alert-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid;
      transition: all 0.3s ease;
    }
    
    .alert-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    
    .alert-card.new-alert {
      animation: slideIn 0.5s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .alert-card.dangerous {
      border-color: #ff5252;
      background: linear-gradient(135deg, rgba(255, 82, 82, 0.15) 0%, rgba(255, 82, 82, 0.05) 100%);
    }
    
    .alert-card.safe {
      border-color: #4caf50;
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
    }
    
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .alert-header h4 {
      font-size: 1rem;
      margin: 0;
    }
    
    .alert-card.dangerous .alert-header h4 { color: #ff5252; }
    .alert-card.safe .alert-header h4 { color: #4caf50; }
    
    .alert-id {
      font-size: 0.8rem;
      color: #666;
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .message {
      font-weight: 500;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    
    .telemetry {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin: 12px 0;
    }
    
    .telemetry-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #aaa;
    }
    
    .telemetry-icon {
      font-size: 1rem;
    }
    
    .impact-info {
      background: rgba(0, 0, 0, 0.2);
      padding: 12px;
      border-radius: 8px;
      margin: 12px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .impact-energy {
      font-size: 0.9rem;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.8rem;
      background: #4caf50;
      color: white;
    }
    
    .status-badge.catastrophic {
      background: #ff5252;
    }
    
    .timestamp {
      display: block;
      margin-top: 12px;
      color: #666;
      font-size: 0.8rem;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  alerts: (Alert & { isNew?: boolean })[] = [];
  loading = true;
  error: string | null = null;
  sseConnected = false;
  
  private sseSubscription?: Subscription;

  get dangerousCount(): number {
    return this.alerts.filter(a => this.checkDangerous(a)).length;
  }

  get safeCount(): number {
    return this.alerts.filter(a => !this.checkDangerous(a)).length;
  }

  constructor(
    private missionService: MissionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAlerts();
    this.subscribeToAlertStream();
  }
  
  ngOnDestroy() {
    this.sseSubscription?.unsubscribe();
  }
  
  subscribeToAlertStream() {
    this.sseSubscription = this.missionService.getAlertStream().subscribe({
      next: (alert) => {
        this.sseConnected = true;
        
        const exists = this.alerts.some(a => a.id === alert.id);
        if (!exists) {
          const newAlert = { ...alert, isNew: true };
          this.alerts.unshift(newAlert);
          
          if (this.alerts.length > 10) {
            this.alerts.pop();
          }
          
          this.calculateImpactForAlert(newAlert);
          
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
        
        setTimeout(() => this.subscribeToAlertStream(), 5000);
      }
    });
  }

  loadAlerts() {
    this.missionService.getAlerts().subscribe({
      next: data => {
        this.alerts = data.reverse();
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
