import { Component } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';

interface Item {
  userid: string;
  title: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>;
  public items: Observable<Item[]>;
  public url: string = '';
  public user: any;
  private init: boolean = false;

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore, private http: HttpClient) {
    this.afAuth.authState.subscribe((user) => {
      this.user = user;
      this.initFetch();
    });

  }

  public initFetch() {
    if (this.init) {
      return;
    }
    this.init = true;
    this.itemsCollection = this.afs.collection<Item>('items', (ref) => {
      return ref.where('userid', '==', this.user.uid);
    });
    this.items = this.itemsCollection.valueChanges();
  }

  public login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public logout() {
    this.afAuth.auth.signOut();
  }

  public onSubmit() {
    const body = {
      url: this.url,
      userid: this.user.uid
    };
    this.http.post('http://127.0.0.1:8081/scrape', body)
    .subscribe((data) => {
      console.log('data', data);
    });
  }
}
