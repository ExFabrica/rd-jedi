import { Component, Input, OnInit } from '@angular/core';
import { IMovie } from '../interfaces';

@Component({
  selector: 'app-moviecard',
  templateUrl: './moviecard.html',
  styleUrls: ['./moviecard.css'],
})
export class MoviecardComponent implements OnInit {
  @Input() movie!: IMovie;
  constructor() { }

  ngOnInit(): void { }
}
