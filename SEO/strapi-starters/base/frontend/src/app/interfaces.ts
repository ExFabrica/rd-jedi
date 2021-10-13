export interface IMovie {
    id: string;
    name: string;
    genre: string;
    imageUrl: string;
    synopsis: string;
    year: string;
    tags: Itag[];
}

export interface Itag {
    title: string;
}