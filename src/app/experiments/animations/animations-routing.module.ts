import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AnimationsPage } from './animations.page';

const routes: Routes = [{ path: '', component: AnimationsPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnimationsPageRoutingModule {}
