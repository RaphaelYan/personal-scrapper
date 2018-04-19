import { Component, Input } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() user: any;

  constructor(public afAuth: AngularFireAuth) { }

  public logout() {
    this.afAuth.auth.signOut();
  }
}
