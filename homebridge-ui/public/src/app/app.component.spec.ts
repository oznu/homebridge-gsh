import { TestBed } from '@angular/core/testing';
import { MockHomebridgePluginUi } from '@homebridge/plugin-ui-utils';
import * as flushPromises from 'flush-promises';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should request the plugin config', async () => {
    // setup mocks
    window.homebridge = new MockHomebridgePluginUi();
    spyOn(window.homebridge, 'getPluginConfig');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    await flushPromises();

    expect(window.homebridge.getPluginConfig).toHaveBeenCalled();
  });

});
