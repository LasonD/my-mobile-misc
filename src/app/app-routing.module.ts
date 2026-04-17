import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'game', pathMatch: 'full' },
  {
    path: 'game',
    loadChildren: () =>
      import('./experiments/game/game.module').then((m) => m.GamePageModule),
  },
  {
    path: 'camera',
    loadChildren: () =>
      import('./experiments/camera/camera.module').then((m) => m.CameraPageModule),
  },
  {
    path: 'preferences',
    loadChildren: () =>
      import('./experiments/preferences/preferences.module').then(
        (m) => m.PreferencesPageModule
      ),
  },
  {
    path: 'charts',
    loadChildren: () =>
      import('./experiments/charts/charts.module').then((m) => m.ChartsPageModule),
  },
  {
    path: 'animations',
    loadChildren: () =>
      import('./experiments/animations/animations.module').then(
        (m) => m.AnimationsPageModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
