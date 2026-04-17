import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-camera',
  templateUrl: 'camera.page.html',
  styleUrls: ['camera.page.scss'],
  standalone: false,
})
export class CameraPage {
  photoUrl: string | null = null;
  error: string | null = null;
  loading = false;

  async capture(source: 'camera' | 'gallery') {
    this.error = null;
    this.loading = true;
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      });
      this.photoUrl = image.dataUrl ?? null;
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }

  clear() {
    this.photoUrl = null;
    this.error = null;
  }
}
