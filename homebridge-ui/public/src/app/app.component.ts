import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';

import { PluginConfig, PluginSchema, ServerEnvMetadata } from '@homebridge/plugin-ui-utils/dist/ui.interface';
import { TranslateService } from './translate.service';

const jwtHelper = new JwtHelperService();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private linkDomain = 'https://homebridge-gsh.iot.oz.nu';
  private linkUrl = this.linkDomain + '/link-account';

  private popup: Window;
  private originCheckInterval;

  public pluginConfig: PluginConfig;
  public schema: PluginSchema;
  public env: ServerEnvMetadata['env'] = window.homebridge.serverEnv.env;
  public form: FormGroup;

  public linkType: string;
  public justLinked = false;

  public showAdvanced = false;
  public ready = false;

  constructor(
    public translateService: TranslateService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.schema = await window.homebridge.getPluginConfigSchema();
    const configBlocks = await window.homebridge.getPluginConfig();

    if (!configBlocks.length) {
      this.pluginConfig = {
        name: 'Google Smart Home',
        platform: this.schema.pluginAlias,
      };
    } else {
      this.pluginConfig = configBlocks[0];
    }

    this.generateForm();
    this.parseToken();

    this.ready = true;

    window.addEventListener('message', this.windowMessageListener, false);
  }

  generateForm() {
    this.form = new FormGroup({
      platform: new FormControl(this.schema.pluginAlias),
      name: new FormControl(this.pluginConfig.name || 'Google Smart Home'),
      notice: new FormControl('Keep your token a secret!'),
      twoFactorAuthPin: new FormControl(this.pluginConfig.twoFactorAuthPin, [Validators.pattern(/^[0-9]*$/)]),
      debug: new FormControl(this.pluginConfig.debug || false)
    });

    this.form.valueChanges.subscribe((value) => {
      value.token = this.pluginConfig.token;
      if (!value.twoFactorAuthPin) {
        delete value.twoFactorAuthPin;
      }
      this.pluginConfig = value;
      this.updateConfig();
    });
  }

  async updateConfig() {
    return window.homebridge.updatePluginConfig([this.pluginConfig]);
  }

  linkAccount() {
    const w = 450;
    const h = 700;
    const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
    const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
    this.popup = window.open(
      this.linkUrl, 'oznu-google-smart-home-auth',
      'toolbar=no, location=no, directories=no, status=no, menubar=no scrollbars=no, resizable=no, copyhistory=no, ' +
      'width=' + w + ', height=' + h + ', top=' + y + ', left=' + x,
    );

    // simple message to popup to provide the current hostname
    this.originCheckInterval = setInterval(() => {
      this.popup.postMessage('origin-check', this.linkDomain);
    }, 2000);
  }

  async processToken(token) {
    clearInterval(this.originCheckInterval);
    if (this.popup) {
      this.popup.close();
    }
    this.pluginConfig.token = token;
    this.pluginConfig.notice = 'Keep your token a secret!';


    this.parseToken();
    await this.updateConfig();
    await window.homebridge.savePluginConfig();
  }

  parseToken() {
    if (this.pluginConfig.token) {
      try {
        const decoded = jwtHelper.decodeToken(this.pluginConfig.token);
        this.linkType = decoded.id.split('|')[0].split('-')[0];
      } catch (e) {
        window.homebridge.toast.error(
          'Invalid account linking token in config.json',
          this.translateService.translations['toast.title_error']
        );
        delete this.pluginConfig.token;
      }
    }
  }

  windowMessageListener = (e) => {
    if (e.origin !== this.linkDomain) {
      console.log('Refusing to process message from', e.origin);
      return;
    }

    try {
      const data = JSON.parse(e.data);
      if (data.token) {
        this.processToken(data.token);
      }
    } catch (e) {
      console.error(e);
    }
  }

  ngOnDestroy() {
    clearInterval(this.originCheckInterval);
    window.removeEventListener('message', this.windowMessageListener);
    if (this.popup) {
      this.popup.close();
    }
  }

}
