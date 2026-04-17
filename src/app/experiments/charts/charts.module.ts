import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ChartsPage } from './charts.page';
import { ChartsPageRoutingModule } from './charts-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, ChartsPageRoutingModule],
  declarations: [ChartsPage],
})
export class ChartsPageModule {}
