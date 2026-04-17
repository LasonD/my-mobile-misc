import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashaPage } from './dasha.page';

const routes: Routes = [{ path: '', component: DashaPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashaPageRoutingModule {}
