import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-addmovie',
  template: `
    <div class="modal">
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Movie</h3>
          <span style="padding: 10px;cursor: pointer;" (click)="closeModal()"
            >X</span
          >
        </div>
        <div class="modal-body content">
          <div class="inputField">
            <div class="label"><label>Name</label></div>
            <div><input id="addMovieName" type="text" /></div>
          </div>
          <div class="inputField">
            <div class="label"><label>ImageUrl</label></div>
            <div><input id="addMovieImageUrl" type="text" /></div>
          </div>
          <div class="inputField">
            <div class="label"><label>Synopsis</label></div>
            <div><input id="addMovieSynopsis" type="text" /></div>
          </div>
          <div class="inputField">
            <div class="label"><label>Year</label></div>
            <div><input id="addMovieYear" type="text" /></div>
          </div>
          <div class="inputField">
            <div class="label"><label>Genre</label></div>
            <div><input id="addMovieGenre" type="text" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button (click)="closeModal()">Cancel</button>
          <button
            [disabled]="disable"
            class="btn"
            (click)="addNewMovie($event)"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .label {
        padding: 4px 0;
        font-size: small;
        color: rgb(51, 55, 64);
      }
      .content {
        display: flex;
        flex-wrap: wrap;
      }
      .inputField {
        margin: 3px 7px;
        flex: 1 40%;
      }
    `,
  ],
})
export class AddmovieComponent implements OnInit {
  @Output() closeDialog = new EventEmitter();
  @Output() refreshMovies = new EventEmitter();
  disable = false;
  constructor(private http: HttpClient) {}

  ngOnInit(): void {}
  addNewMovie(e: Event) {
    this.disable = true;
    const {
      addMovieName,
      addMovieYear,
      addMovieGenre,
      addMovieImageUrl,
      addMovieSynopsis,
    } = window as any;
    this.http
      .post('http://localhost:1337/movies', {
        name: addMovieName.value,
        year: addMovieYear.value,
        synopsis: addMovieSynopsis.value,
        imageUrl: addMovieImageUrl.value,
        genre: addMovieGenre.value,
      })
      .subscribe(
        (data) => {
          this.disable = false;
          this.refreshMovies.emit('');
          this.closeDialog.emit('');
        },
        (err) => {
          this.disable = false;
        }
      );
  }
  closeModal() {
    this.closeDialog.emit('');
  }
}
