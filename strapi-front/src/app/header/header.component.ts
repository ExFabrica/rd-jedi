import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <section class="header">
      <div class="headerName">MovieFlix</div>
    </section>
  `,
  styles: [
    `
      .header {
        height: 40px;
        background-color: black;
        color: white;
        display: flex;
        align-items: center;
        padding: 10px;
        font-family: sans-serif;
      }
      .headerName {
        font-size: 1.8em;
      }
    `,
  ],
})
export class HeaderComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
