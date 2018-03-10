import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'item-scrapped',
  templateUrl: './item-scrapped.component.html',
  styleUrls: ['./item-scrapped.component.scss']
})
export class ItemScrappedComponent implements OnInit {
  @Input() public item;

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

}
