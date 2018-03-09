import { Component } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Item {
  userid: string;
  title: string;
  status: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>;
  public items: Observable<DocumentChangeAction[]>;

  public form: any = {
    provider: 'youtube',
    url: ''
  };
  public user: any;
  public statuses: any = [
    {
      label: 'A traiter',
      value: 'scrapped'
    }, {
      label: 'Supprimés',
      value: 'deleted'
    }, {
      label: 'Acceptés',
      value: 'accepted'
    }
  ];
  public currentStatus: string = 'scrapped';

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore, private http: HttpClient) {
    this.afAuth.authState.subscribe((user) => {
      this.user = user;
      this.initFetch();
    });
  }

  public initFetch() {
    this.itemsCollection = this.afs.collection<Item>('items', (ref) => {
      return ref.where('userid', '==', this.user.uid).where('status', '==', this.currentStatus);
    });
    this.items = this.itemsCollection.snapshotChanges()
  }

  public login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public logout() {
    this.afAuth.auth.signOut();
  }

  public onSubmit() {
    const body = {
      url: this.form.url,
      provider: this.form.provider,
      userid: this.user.uid
    };
    this.http.post('http://127.0.0.1:8081/scrape', body, {
      headers: new HttpHeaders().set('Content-Type', 'application/json'),
      responseType: 'text'
     })
    .subscribe((data) => {
      console.log('data', data);
    });
  }

  public remove(item) {
    item.payload.doc.ref.update({status: 'deleted'});
  }

  public select(item) {
    item.payload.doc.ref.update({status: 'accepted'});
  }

  public filterByStatus(status) {
    this.currentStatus = status.value;
    this.initFetch();
  }
}
