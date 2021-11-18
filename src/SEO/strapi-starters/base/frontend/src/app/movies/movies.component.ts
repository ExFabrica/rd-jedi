import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Apollo, gql, QueryRef } from 'apollo-angular';
import { Subscription } from 'rxjs';
import { IMovie } from '../interfaces';

@Component({
  selector: 'app-movies',
  templateUrl: "./movies.html",
  styleUrls: ['./movies.css'],
})

export class MovielistComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modal') modal!: TemplateRef<any>;
  @ViewChild('vc', { read: ViewContainerRef }) vc!: ViewContainerRef;

  movies: IMovie[] = [];
  private vRef: any = null;
  querySubscription: Subscription | undefined;
  postsQuery: QueryRef<any>;

  constructor(private apollo: Apollo) {
    this.postsQuery = this.apollo.watchQuery<any>({
      query:  gql`
      {
        movies {
          id, name, imageUrl, synopsis, year, genre, tags { title }
        }
      }
    `,
      //pollInterval: 100,
    });
   }

  ngOnInit(): void {
    this.fetchMovies();
  }

  ngAfterViewInit() {
    this.vRef = this.vc;
  }

  ngOnDestroy() {
    this.querySubscription?.unsubscribe();
  }

  fetchMovies() {
    this.querySubscription = this.postsQuery.valueChanges.subscribe(result => {
      this.movies = result?.data?.movies;
    });
  }

  showAddMovieDialog() {
    let view = this.modal.createEmbeddedView(null);
    this.vRef.insert(view);
  }

  closeDialog() {
    this.vRef.clear();
    this.postsQuery.refetch();
  }
}
