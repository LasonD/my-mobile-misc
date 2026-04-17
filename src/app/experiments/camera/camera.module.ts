import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { CameraPage } from './camera.page';
import { CameraPageRoutingModule } from './camera-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, CameraPageRoutingModule],
  declarations: [CameraPage],
})
export class CameraPageModule {}
