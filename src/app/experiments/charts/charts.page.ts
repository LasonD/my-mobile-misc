import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-charts',
  templateUrl: 'charts.page.html',
  styleUrls: ['charts.page.scss'],
  standalone: false,
})
export class ChartsPage implements AfterViewInit, OnDestroy {
  @ViewChild('barCanvas', { static: true }) barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineCanvas', { static: true }) lineCanvas!: ElementRef<HTMLCanvasElement>;

  private bar?: Chart;
  private line?: Chart;

  ngAfterViewInit() {
    this.render();
  }

  ngOnDestroy() {
    this.bar?.destroy();
    this.line?.destroy();
  }

  regenerate() {
    this.bar?.destroy();
    this.line?.destroy();
    this.render();
  }

  private render() {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const rand = () => Math.round(Math.random() * 100);

    this.bar = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Steps (thousands)',
            data: labels.map(() => rand()),
            backgroundColor: 'rgba(56, 128, 255, 0.7)',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    this.line = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Heart rate (bpm)',
            data: labels.map(() => 60 + rand() / 2),
            borderColor: 'rgba(235, 68, 90, 1)',
            backgroundColor: 'rgba(235, 68, 90, 0.2)',
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }
}
