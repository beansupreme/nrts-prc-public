import { Component } from '@angular/core';
import { Application } from 'app/models/application';

@Component({
  selector: 'app-marker-popup',
  templateUrl: './marker-popup.component.html',
  styleUrls: ['./marker-popup.component.scss']
})

export class MarkerPopupComponent {

  public app: Application = null;

}
