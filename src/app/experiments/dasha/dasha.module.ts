import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { DashaPage } from './dasha.page';
import { DashaPageRoutingModule } from './dasha-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, DashaPageRoutingModule],
  declarations: [DashaPage],
})
export class DashaPageModule {}
