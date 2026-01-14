import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell-container">
      <header class="shell-header">
        <div class="logo">
          <span class="logo-icon">🛡️</span>
          <h1>Neo Sentinel</h1>
        </div>
        <nav class="main-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <span class="nav-icon">📊</span> Dashboard
          </a>
          <a routerLink="/telemetry" routerLinkActive="active">
            <span class="nav-icon">📡</span> Telemetry
          </a>
          <a routerLink="/hazards" routerLinkActive="active">
            <span class="nav-icon">⚠️</span> Hazards
          </a>
        </nav>
        <div class="header-actions">
          <span class="status-indicator online">● System Online</span>
        </div>
      </header>
      
      <main class="shell-content">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="shell-footer">
        <p>© 2026 Neo Sentinel - Planetary Defense System | Microfrontend Architecture</p>
      </footer>
    </div>
  `,
  styles: [`
    .shell-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .shell-header {
      background: linear-gradient(90deg, #0f0f23 0%, #1a1a3e 100%);
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      font-size: 28px;
    }
    
    .logo h1 {
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(90deg, #4fc3f7, #7c4dff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .main-nav {
      display: flex;
      gap: 8px;
    }
    
    .main-nav a {
      padding: 10px 20px;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    
    .main-nav a:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .main-nav a.active {
      background: linear-gradient(135deg, #4fc3f7 0%, #7c4dff 100%);
      color: white;
    }
    
    .nav-icon {
      font-size: 1.1rem;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      padding: 6px 12px;
      border-radius: 20px;
      background: rgba(0, 0, 0, 0.3);
    }
    
    .status-indicator.online {
      color: #4caf50;
    }
    
    .shell-content {
      flex: 1;
      padding: 24px;
      background: linear-gradient(180deg, #16213e 0%, #1a1a2e 100%);
    }
    
    .shell-footer {
      background: #0f0f23;
      padding: 16px;
      text-align: center;
      font-size: 0.85rem;
      color: #666;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
  `]
})
export class AppComponent {
  title = 'Neo Sentinel Shell';
}
