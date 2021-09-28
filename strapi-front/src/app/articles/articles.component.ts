import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.css']
})
export class ArticlesComponent implements OnInit {
  articles: any[] = [];
  querySubscription: Subscription | undefined;

  constructor(private apollo: Apollo) { }

  ngOnInit(): void {
    this.fetchArticles();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.querySubscription?.unsubscribe();
  }

  fetchArticles() {
    this.querySubscription = this.apollo.watchQuery<any, any[]>({
      query: gql`
        {
          articles {
           id, title, content
          }
      }
    `
    }).valueChanges.subscribe(result => {
      console.log("result", result);
      this.articles = result?.data?.articles;
    });
  }

}
