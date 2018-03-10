import { Component, Input } from '@angular/core';

@Component({
  selector: 'item-scrapped',
  templateUrl: './item-scrapped.component.html',
})
export class ItemScrappedComponent {
  @Input() public item;
}
