import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { mountReactProductDetails } from '../../react-client/main';

@Component({
  selector: 'app-react-product-details',
  standalone: true,
  template: `<div #reactContainer class="react-mount-root"></div>`,
  styleUrls: ['../../react-client/pages/ProductDetails.css'],
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
export class ReactProductDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('reactContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  private unmountFn?: () => void;

  ngOnInit(): void {
    if (this.containerRef?.nativeElement) {
      this.unmountFn = mountReactProductDetails(this.containerRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.unmountFn) {
      this.unmountFn();
    }
  }
}

