import { Component, Input } from '@angular/core';

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
})
export class ItemComponent {
  @Input() public item;

}
