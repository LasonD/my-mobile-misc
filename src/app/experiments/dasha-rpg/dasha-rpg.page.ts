import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as Phaser from 'phaser';

import { DirectoryScene } from './render/directory-scene';
import { RpgScene } from './render/rpg-scene';
import { TitleScene } from './render/title-scene';

@Component({
  selector: 'app-dasha-rpg',
  templateUrl: 'dasha-rpg.page.html',
  styleUrls: ['dasha-rpg.page.scss'],
  standalone: false,
})
export class DashaRpgPage implements AfterViewInit, OnDestroy {
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
      backgroundColor: '#1a1220',
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
      scene: [TitleScene, RpgScene, DirectoryScene],
    });
  }

  ngOnDestroy() {
    this.game?.destroy(true);
    this.game = undefined;
  }
}
