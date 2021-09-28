import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

@Component({
  selector: 'app-movieview',
  template: `
    <div class="movieview-container">
      <div class="movieview">
        <div
          class="movieview-image"
          style="background-image: url({{ movie?.imageUrl }});"
        ></div>

        <div class="movieview-details">
          <div class="movieview-name">
            <h1>{{ movie?.name }} ({{ movie?.year }})</h1>
          </div>
          <div style="padding: 5px 0;">
            <span>
              <button
                style="margin-left: 0;"
                class="btn"
                (click)="showEditMovieDialog()"
              >
                Edit
              </button>
              <button class="btn btn-danger" (click)="deleteMovie()">
                Delete
              </button>
            </span>
          </div>
          <div style="padding: 5px 0;">
            <span> Genre: {{ movie?.genre }}</span>
          </div>
          <div style="padding: 5px 0;">
            <span>Year: {{ movie?.year }}</span>
          </div>
          <div class="movieview-synopsis-cnt">
            <h2>Synopsis</h2>
            <div class="movie-synopsis">{{ movie?.synopsis }}</div>
          </div>
        </div>
      </div>

      <ng-container #vcRef></ng-container>
      <ng-template #modalRef>
        <app-editmovie
          (closeDialog)="closeDialog()"
          [movie]="movie"
        ></app-editmovie>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .movieview-container {
        display: flex;
        justify-content: center;
      }

      .movieview {
        display: flex;
        justify-content: center;
        padding: 15px;
        width: 900px;
      }

      .movieview-image {
        height: 500px;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        margin-right: 10px;
        padding-right: 15px;
        flex: 5;
      }

      .movieview-details {
        font-family: system-ui;
        padding-left: 15px;
        flex: 7;
      }

      .movieview-name h1 {
        margin-top: 0;

        border-top: 1px solid;
        border-bottom: 1px solid;
        padding: 10px 0;
      }

      .movieview-synopsis-cnt h2 {
        border-bottom: 1px solid;
        padding-bottom: 4px;
      }
    `,
  ],
})
export class MovieviewComponent implements OnInit {
  movie: any;
  @ViewChild('modalRef') modalRef!: TemplateRef<any>;
  @ViewChild('vcRef', { read: ViewContainerRef }) vcRef!: ViewContainerRef;
  vRef: any = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: Params) => {
      if (params.id) {
        const movieId = params.id;
        this.http
          .get('http://localhost:1337/movies/' + movieId)
          .subscribe((data: any) => (this.movie = data));
      }
    });
  }

  deleteMovie() {
    if (confirm('Do you really want to delete this movie')) {
      this.http
        .delete('http://localhost:1337/movies/' + this.movie?.id)
        .subscribe((data) => {
          this.router.navigate(['/']);
        });
    }
  }

  showEditMovieDialog() {
    let view = this.modalRef.createEmbeddedView(null);
    this.vcRef.insert(view);
  }

  closeDialog() {
    this.vcRef.clear();
  }
}
