import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { GamePage } from './game.page';
import { GamePageRoutingModule } from './game-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, GamePageRoutingModule],
  declarations: [GamePage],
})
export class GamePageModule {}
