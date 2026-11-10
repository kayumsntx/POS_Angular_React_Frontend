import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { mountReactPaymentSuccess } from '../../react-client/main';

@Component({
  selector: 'app-react-payment-success',
  standalone: true,
  template: `<div #reactContainer class="react-mount-root"></div>`,
  styleUrls: ['../../react-client/pages/PaymentSuccess.css'],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 80vh;
      margin: 0;
      padding: 0;
    }
    .react-mount-root {
      width: 100%;
      min-height: 80vh;
    }
  `]
})
export class ReactPaymentSuccessComponent implements OnInit, OnDestroy {
  @ViewChild('reactContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  private unmountFn?: () => void;

  ngOnInit(): void {
    if (this.containerRef?.nativeElement) {
      this.unmountFn = mountReactPaymentSuccess(this.containerRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.unmountFn) {
      this.unmountFn();
    }
  }
}

