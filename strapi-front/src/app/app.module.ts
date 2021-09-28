import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MovielistComponent } from './movies/movies.component';
import { MoviecardComponent } from './moviecard/moviecard.component';
import { MovieviewComponent } from './movieview/movieview.component';
import { HeaderComponent } from './header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { AddmovieComponent } from './addmovie/addmovie.component';
import { EditmovieComponent } from './editmovie/editmovie.component';
import { GraphQLModule } from './graphql.module';
import { LayoutComponent } from './layout/layout.component';
import { ArticlesComponent } from './articles/articles.component';

@NgModule({
  declarations: [
    AppComponent,
    MovielistComponent,
    MoviecardComponent,
    MovieviewComponent,
    HeaderComponent,
    AddmovieComponent,
    EditmovieComponent,
    LayoutComponent,
    ArticlesComponent
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, GraphQLModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
