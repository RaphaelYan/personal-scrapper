import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: '[item-scrapped]',
  templateUrl: './item-scrapped.component.html',
  styleUrls: ['./item-scrapped.component.scss']
})
export class ItemScrappedComponent implements OnInit {

  @Input('item-scrapped') public item;
  private swipeCoord?: [number, number];
  private swipeTime?: number;

  public itemData;

  public ngOnInit() {
    this.itemData = this.item.payload.doc.data();
  }

  public remove() {
    this.item.payload.doc.ref.update({status: 'deleted'});
  }

  public accept() {
    this.item.payload.doc.ref.update({status: 'accepted'});
  }

  public scrapped() {
    this.item.payload.doc.ref.update({status: 'scrapped'});
  }

  swipe(e: TouchEvent, when: string): void {
    const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
    const time = new Date().getTime();

    if (when === 'start') {
      this.swipeCoord = coord;
      this.swipeTime = time;
    } else if (when === 'end') {
      const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
      const duration = time - this.swipeTime;
      if ((duration < 1000 && Math.abs(direction[0]) > 30) && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) {
        const swipe = direction[0] < 0 ? 'left' : 'right';
        if (swipe === 'right' && this.itemData.status === 'scrapped' || this.itemData.status === 'deleted') {
          this.accept();
        } else if (swipe === 'left' && this.itemData.status === 'scrapped' || this.itemData.status === 'accepted') {
          this.remove();
        } else if (swipe === 'right' && this.itemData.status === 'deleted' || this.itemData.status === 'accepted') {
          this.scrapped();
        }
      }
    }
  }
}
