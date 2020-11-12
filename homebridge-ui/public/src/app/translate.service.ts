import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  public translations: Record<string, string>;
  public ready = false;

  constructor() {
    window.homebridge.i18nGetTranslation()
      .then((translations) => {
        this.translations = translations;
        this.ready = true;
      });
  }
}
