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

interface Site {
  userid: string;
  url: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>;
  public items: Observable<DocumentChangeAction[]>;
  private sitesCollection: AngularFirestoreCollection<Site>;
  public sites: Observable<DocumentChangeAction[]>;

  public showForm: boolean = false;

  public selectedUrl: any = '';
  public formSite: any = {
    provider: '',
    label: '',
    url: ''
  };
  public user: any;
  public statuses: any = [
    {
      btn: 'btn-danger',
      label: 'Enlevés',
      value: 'deleted'
    }, {
      btn: 'btn-primary',
      label: 'A traiter',
      value: 'scrapped'
    }, {
      btn: 'btn-success',
      label: 'Gardés',
      value: 'accepted'
    }
  ];
  public currentStatus: string = 'scrapped';

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore, private http: HttpClient) {
    this.afAuth.authState.subscribe((user) => {
      this.user = user;
      if (!user) {
        return;
      }
      this.initFetch();
      this.initSites();
    });
  }

  public initFetch() {
    this.itemsCollection = this.afs.collection<Item>('items', (ref) => {
      return ref.where('userid', '==', this.user.uid).where('status', '==', this.currentStatus);
    });
    this.items = this.itemsCollection.snapshotChanges();
  }

  public initSites() {
    this.sitesCollection = this.afs.collection<Site>('sites', (ref) => {
      return ref.where('userid', '==', this.user.uid);
    });
    this.sites = this.sitesCollection.snapshotChanges();
  }

  public login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public logout() {
    this.afAuth.auth.signOut();
  }

  public onSubmitScrap() {
    this.http.post('http://127.0.0.1:8081/scrape', this.selectedUrl, {
      headers: new HttpHeaders().set('Content-Type', 'application/json'),
      responseType: 'text'
     })
    .subscribe((data) => {
      console.log('data', data);
    });
  }

  public onSubmitSite() {
    const body = {
      url: this.formSite.url,
      provider: this.formSite.provider,
      label: this.formSite.label,
      userid: this.user.uid
    };
    this.sitesCollection.add(body);
    this.formSite.url = '';
    this.formSite.provider = '';
    this.formSite.label = '';
  }

  public filterByStatus(status) {
    this.currentStatus = status.value;
    this.initFetch();
  }

  public toggleForm() {
    this.showForm = !this.showForm;
  }

  public compareSelectedUrl(itemA, itemB) {
    return itemA && itemB && itemA.url == itemB.url;
  }
}
