import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { DashaRpgPage } from './dasha-rpg.page';
import { DashaRpgPageRoutingModule } from './dasha-rpg-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, DashaRpgPageRoutingModule],
  declarations: [DashaRpgPage],
})
export class DashaRpgPageModule {}
