import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { mountReactProfile } from '../../react-client/main';

@Component({
  selector: 'app-react-profile',
  standalone: true,
  template: `<div #reactContainer class="react-mount-root"></div>`,
  styleUrls: ['../../react-client/pages/Profile.css'],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    .react-mount-root {
      width: 100%;
      min-height: 100vh;
    }
  `]
})
export class ReactProfileComponent implements OnInit, OnDestroy {
  @ViewChild('reactContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  private unmountFn?: () => void;

  ngOnInit(): void {
    if (this.containerRef?.nativeElement) {
      this.unmountFn = mountReactProfile(this.containerRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.unmountFn) {
      this.unmountFn();
    }
  }
}

