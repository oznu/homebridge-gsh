import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import '@homebridge/plugin-ui-utils/dist/ui.interface';

import { AppComponent } from './app.component';
import { TranslatePipe } from './translate.pipe';

@NgModule({
  declarations: [
    AppComponent,
    TranslatePipe,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
