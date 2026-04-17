import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  AnimationController,
  GestureController,
  Animation,
  Gesture,
} from '@ionic/angular';

@Component({
  selector: 'app-animations',
  templateUrl: 'animations.page.html',
  styleUrls: ['animations.page.scss'],
  standalone: false,
})
export class AnimationsPage implements AfterViewInit, OnDestroy {
  @ViewChild('pulseBox', { static: true }) pulseBox!: ElementRef<HTMLElement>;
  @ViewChild('dragCard', { static: true }) dragCard!: ElementRef<HTMLElement>;

  private pulseAnim?: Animation;
  private gesture?: Gesture;

  constructor(
    private animationCtrl: AnimationController,
    private gestureCtrl: GestureController
  ) {}

  ngAfterViewInit() {
    this.buildPulseAnimation();
    this.buildDragGesture();
  }

  ngOnDestroy() {
    this.pulseAnim?.destroy();
    this.gesture?.destroy();
  }

  playPulse() {
    this.pulseAnim?.play();
  }

  private buildPulseAnimation() {
    this.pulseAnim = this.animationCtrl
      .create()
      .addElement(this.pulseBox.nativeElement)
      .duration(900)
      .iterations(1)
      .easing('cubic-bezier(0.2, 0.8, 0.2, 1)')
      .keyframes([
        { offset: 0, transform: 'scale(1) rotate(0deg)', opacity: '1' },
        { offset: 0.5, transform: 'scale(1.2) rotate(180deg)', opacity: '0.7' },
        { offset: 1, transform: 'scale(1) rotate(360deg)', opacity: '1' },
      ]);
  }

  private buildDragGesture() {
    const el = this.dragCard.nativeElement;
    this.gesture = this.gestureCtrl.create({
      el,
      gestureName: 'drag-card',
      threshold: 5,
      onStart: () => {
        el.style.transition = 'none';
      },
      onMove: (ev) => {
        el.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px) rotate(${
          ev.deltaX / 20
        }deg)`;
      },
      onEnd: () => {
        el.style.transition = 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = 'translate(0, 0) rotate(0)';
      },
    });
    this.gesture.enable();
  }
}
