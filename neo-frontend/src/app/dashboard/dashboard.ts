import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
// 👇 Added ImpactResult to imports
import { MissionService, Alert, ImpactResult } from '../services/mission';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="container">
      <h1>👮 Mission Control Dashboard</h1>
      
      <div class="grid-layout">
        
        <div class="column">
          <h2>📡 Live Hazard Feed</h2>
          
          <p *ngIf="loading">Loading alerts...</p>
          <p *ngIf="error" class="error">{{ error }}</p>
          <p *ngIf="!loading && !error && alerts.length === 0">No alerts at this time.</p>

          <div class="alert-grid">
            <div *ngFor="let alert of alerts" class="alert-card critical">
              <h3>🚨 COLLISION WARNING</h3>
              <p>{{ alert.message }}</p>
              <small>{{ alert.timestamp }}</small>
            </div>
          </div>
        </div>

        <div class="column">
          <h2>☄️ Impact Calculator</h2>
          <div class="calculator-card">
            <label>Velocity (km/s):</label>
            <input type="number" #vel placeholder="20" value="20">
            
            <label>Diameter (m):</label>
            <input type="number" #dia placeholder="50" value="50">

            <button (click)="calculate(vel.value, dia.value)">Analyze Impact</button>

            <div *ngIf="impactResult" class="result-box" [class.danger]="impactResult.status === 'CATASTROPHIC'">
              <h3>Analysis Complete</h3>
              <p><strong>Energy:</strong> {{ impactResult.impact_energy }}</p>
              <p><strong>Status:</strong> {{ impactResult.status }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; font-family: sans-serif; max-width: 1200px; margin: 0 auto; }
    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    
    /* Alert Styles */
    .alert-card { background: #ffebee; border-left: 5px solid #ef5350; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
    .critical h3 { color: #d32f2f; margin: 0 0 5px 0; }
    .error { color: #d32f2f; }
    
    /* Calculator Styles */
    .calculator-card { background: #f5f5f5; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
    input { display: block; width: 100%; padding: 8px; margin: 5px 0 15px 0; }
    button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 1em; }
    button:hover { background: #1565c0; }

    .result-box { margin-top: 20px; padding: 15px; background: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; }
    .result-box.danger { background: #ffebee; border-color: #ef5350; color: #c62828; }
  `]
})
export class DashboardComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;
  error: string | null = null;
  
  // 👇 Added property for result
  impactResult: ImpactResult | null = null;

  constructor(
    private missionService: MissionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAlerts();
    setInterval(() => this.loadAlerts(), 5000);
  }

  loadAlerts() {
    this.missionService.getAlerts().subscribe({
      next: data => {
        this.alerts = data;
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
      error: err => {
        this.loading = false;
        this.error = 'Failed to load alerts. Is backend running?';
        this.cdr.detectChanges();
      }
    });
  }

  calculate(velocity: string, diameter: string) {
    const v = parseFloat(velocity);
    const d = parseFloat(diameter);
    
    this.missionService.calculateImpact(v, d).subscribe(result => {
      this.impactResult = result;
      this.cdr.detectChanges(); // Force update UI
    });
  }
}