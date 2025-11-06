import { Component, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
 private router = inject(Router);


 constructor() {
  this.router.events.subscribe(event => {
    if (event instanceof NavigationStart) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  });
}}
