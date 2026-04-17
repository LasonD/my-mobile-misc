import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as Phaser from 'phaser';

import { DashaScene } from './scenes/dasha-scene';

@Component({
  selector: 'app-dasha',
  templateUrl: 'dasha.page.html',
  styleUrls: ['dasha.page.scss'],
  standalone: false,
})
export class DashaPage implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;

  private game?: Phaser.Game;

  ngAfterViewInit() {
    requestAnimationFrame(() => this.createGame());
  }

  private createGame() {
    const parent = this.container.nativeElement;
    const rect = parent.getBoundingClientRect();
    const width = Math.floor(rect.width || window.innerWidth);
    const height = Math.floor(rect.height || window.innerHeight);

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: '#f2e9f4',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent,
        width,
        height,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false, gravity: { x: 0, y: 0 } },
      },
      scene: [DashaScene],
    });
  }

  ngOnDestroy() {
    this.game?.destroy(true);
    this.game = undefined;
  }
}
