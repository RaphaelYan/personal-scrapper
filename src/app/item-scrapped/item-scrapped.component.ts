import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  /* tslint:disable */
  selector: '[item-scrapped]',
  /* tslint:enable */
  templateUrl: './item-scrapped.component.html',
  styleUrls: ['./item-scrapped.component.scss']
})
export class ItemScrappedComponent implements OnInit {
  /* tslint:disable */
  @Input('item-scrapped') public item;
  /* tslint:enable */
  @Output() public accept = new EventEmitter();
  @Output() public reject = new EventEmitter();
  private swipeCoord?: [number, number];
  private swipeTime?: number;

  public itemData;

  public ngOnInit() {
    this.itemData = this.item.payload.doc.data();
  }

  public setStatus(status) {
    if (status === 'accepted') {
      this.accept.emit();
    } else {
      this.reject.emit();
    }
    setTimeout(() => {
      this.item.payload.doc.ref.update({status: status});
    }, 500);
  }

  public swipe(e: TouchEvent, when: string): void {
    // if (window.screen.width > 575) {
    //   return;
    // }
    // const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
    // const time = new Date().getTime();
    //
    // if (when === 'start') {
    //   this.swipeCoord = coord;
    //   this.swipeTime = time;
    // } else if (when === 'end') {
    //   const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
    //   const duration = time - this.swipeTime;
    //   if ((duration < 1000 && Math.abs(direction[0]) > 30) && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) {
    //     const swipe = direction[0] < 0 ? 'left' : 'right';
    //     if (swipe === 'right' && (this.itemData.status === 'scrapped' || this.itemData.status === 'deleted')) {
    //       this.setStatus('accepted');
    //     } else if (swipe === 'left' && this.itemData.status === 'scrapped') {
    //       this.setStatus('deleted');
    //     } else if ((swipe === 'left' && this.itemData.status === 'deleted') || this.itemData.status === 'accepted') {
    //       this.setStatus('deletedForce');
    //     }
    //   }
    // }
  }
}
