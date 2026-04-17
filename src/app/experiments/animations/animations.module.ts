import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { AnimationsPage } from './animations.page';
import { AnimationsPageRoutingModule } from './animations-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, AnimationsPageRoutingModule],
  declarations: [AnimationsPage],
})
export class AnimationsPageModule {}
