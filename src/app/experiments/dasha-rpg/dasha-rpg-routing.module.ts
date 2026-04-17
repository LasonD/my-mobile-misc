import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashaRpgPage } from './dasha-rpg.page';

const routes: Routes = [{ path: '', component: DashaRpgPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashaRpgPageRoutingModule {}
