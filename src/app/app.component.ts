import { Component, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

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
  @ViewChild('stack') stack;
  // public display: string = 'items';
  public isScrapping: boolean = false;
  private itemsCollection: AngularFirestoreCollection<Item>;
  public items: Observable<DocumentChangeAction[]>;
  private sitesCollection: AngularFirestoreCollection<Site>;
  public sites: Site[];
  public hasItems: boolean = false;
  public fetching: boolean = false;
  public deckOptions: any = {
    infinite: true
  };

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
      btnActive: 'btn-danger',
      btnOutline: 'btn-outline-danger',
      label: 'Enlevés',
      value: 'deleted'
    }, {
      btnActive: 'btn-primary',
      btnOutline: 'btn-outline-primary',
      label: 'A traiter',
      value: 'scrapped'
    }, {
      btnActive: 'btn-success',
      btnOutline: 'btn-outline-success',
      label: 'Gardés',
      value: 'accepted'
    }
  ];
  public providers: any[] = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'mamytwink', label: 'MamyTwink' },
    { value: 'extreme-down', label: 'Extreme-down' },
    { value: 'pshiiit', label: 'pshiiit' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'reddit', label: 'Reddit' }
  ];
  public currentStatus: string = 'scrapped';
  public filterProvider: string = '';

  constructor(private appService: AppService, private afs: AngularFirestore, private http: HttpClient) {
    this.appService.authState.subscribe((user) => {
      this.user = user;
      if (!user) {
        return;
      }
      this.initFetch();
      this.initSites();
    });
  }

  public initFetch() {
    this.hasItems = false;
    this.fetching = true;
    this.itemsCollection = this.afs.collection<Item>('items', (ref) => {
      return ref.where('userid', '==', this.user.uid)
        .where('status', '==', this.currentStatus)
        .orderBy('timestamp', this.currentStatus === 'scrapped' ? 'desc' : 'asc');
    });
    this.items = this.itemsCollection.snapshotChanges()
    .map(actions => {
      this.fetching = false;
      this.hasItems = !!(actions && actions.length);
      console.warn(this.hasItems)
      console.warn('snapshotChanges')
      setTimeout(() => {
        console.log('init');
        this.stack.init();
      });
      return actions;
    });
  }

  public initSites() {
    this.sitesCollection = this.afs.collection<Site>('sites', (ref) => {
      return ref.where('userid', '==', this.user.uid);
    });
    this.sitesCollection.valueChanges()
    .subscribe((sites) => {
      this.sites = sites;
    });
  }

  public onSubmitScrap() {
    this.isScrapping = true;
    this.http.post(environment.url, this.selectedUrl, {
      headers: new HttpHeaders().set('Content-Type', 'application/json'),
      responseType: 'text'
    })
    .subscribe((data) => {
      this.isScrapping = false;
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
    return itemA && itemB && itemA.url === itemB.url;
  }

  public trackByScrapped(index, item) {
    return item.payload.doc.data().id;
  }

  public trackBySite(index, item) {
    return item.url;
  }

  public accept(event) {
    this.stack.accept(() => {
      console.warn('ACCEPT');
    });
  }

  public reject(event) {
    this.stack.reject(() => {
      console.warn('REJECT');
    });
  }

  public next() {
    this.stack.reject();
  }
}
