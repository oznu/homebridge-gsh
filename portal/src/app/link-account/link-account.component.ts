import { Component, OnInit } from '@angular/core';
import { ApiService } from '../_services/api.service';

@Component({
  selector: 'app-link-account',
  templateUrl: './link-account.component.html',
  styleUrls: ['./link-account.component.scss']
})
export class LinkAccountComponent implements OnInit {
  public parentOrigin: string;
  public authData;

  constructor(
    private $api: ApiService,
  ) { }

  ngOnInit() {
    this.$api.get(`/user/token`).subscribe(
      (result) => {
        this.authData = result;
        this.listen();
      },
      (err) => {
        if (err.status === 401) {
          window.location.href = '/user/link-account';
        }
      }
    );
  }

  listen() {
    window.addEventListener('message', (event) => {
      if (event.data === 'origin-check') {
        this.parentOrigin = event.origin;
      }
    }, false);
  }

  confirm() {
    window.opener.postMessage(JSON.stringify(this.authData), this.parentOrigin);
  }

}
