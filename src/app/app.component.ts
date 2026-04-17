import { Component } from '@angular/core';

export interface Experiment {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  readonly experiments: Experiment[] = [
    { path: '/dasha', label: 'Dasha: Session Time', icon: 'heart-outline' },
    { path: '/game', label: 'Drone Strike', icon: 'game-controller-outline' },
    { path: '/camera', label: 'Camera', icon: 'camera-outline' },
    { path: '/preferences', label: 'Preferences', icon: 'save-outline' },
    { path: '/charts', label: 'Charts', icon: 'bar-chart-outline' },
    { path: '/animations', label: 'Animations & Gestures', icon: 'move-outline' },
  ];
}
