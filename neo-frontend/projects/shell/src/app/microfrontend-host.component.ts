import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface MicrofrontendConfig {
  name: string;
  baseUrl: string;
}

@Component({
  selector: 'app-microfrontend-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="microfrontend-container">
      <iframe
        *ngIf="iframeSrc"
        [src]="iframeSrc"
        class="microfrontend-frame"
        (load)="onIframeLoad()"
        (error)="onIframeError()"
        [class.loading]="isLoading"
      ></iframe>
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Loading {{ microfrontendName }}...</p>
      </div>
      <div *ngIf="hasError" class="error-overlay">
        <p>⚠️ Failed to load {{ microfrontendName }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .microfrontend-container {
      position: relative;
      width: 100%;
      height: calc(100vh - 140px);
      min-height: 500px;
    }
    
    .microfrontend-frame {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
      background: transparent;
      transition: opacity 0.3s ease;
    }
    
    .microfrontend-frame.loading {
      opacity: 0.3;
    }
    
    .loading-overlay, .error-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #e0e0e0;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #4fc3f7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-overlay button {
      margin-top: 16px;
      padding: 8px 24px;
      background: #4fc3f7;
      color: #0f0f23;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .error-overlay button:hover {
      background: #29b6f6;
    }
  `]
})
export class MicrofrontendHostComponent implements OnInit, OnDestroy {
  iframeSrc: SafeResourceUrl | null = null;
  microfrontendName = '';
  isLoading = true;
  hasError = false;

  private readonly microfrontends: Record<string, MicrofrontendConfig> = {
    dashboard: {
      name: 'Dashboard',
      baseUrl: this.getMicrofrontendUrl('dashboard')
    }
  };

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadMicrofrontend();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private getMicrofrontendUrl(name: string): string {
    // In production (Docker), microfrontends are served from the same origin
    // In development, they run on different ports
    const isDevelopment = window.location.port === '4200';
    
    if (isDevelopment) {
      // Development mode - separate dev servers
      const ports: Record<string, number> = {
        dashboard: 4201
      };
      return `http://localhost:${ports[name] || 4201}`;
    }
    
    // Docker production mode - served from same nginx with trailing slash
    return `/${name}/`;
  }

  private loadMicrofrontend() {
    const data = this.route.snapshot.data;
    const mfName = data['microfrontend'] as string;
    const mfRoute = data['route'] as string || '/';
    
    const config = this.microfrontends[mfName];
    if (!config) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.microfrontendName = config.name;
    this.isLoading = true;
    this.hasError = false;
    
    const url = `${config.baseUrl}${mfRoute}`;
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onIframeLoad() {
    this.isLoading = false;
    this.hasError = false;
  }

  onIframeError() {
    this.isLoading = false;
    this.hasError = true;
  }

  retry() {
    this.loadMicrofrontend();
  }
}
