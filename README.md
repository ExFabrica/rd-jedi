# Project : RD-STRAPI  
- [Project : RD-STRAPI](#project--rd-strapi)
  - [Prerequist](#prerequist)
  - [Folder structure](#folder-structure)
  - [Build & Run](#build--run)
    - [Backend:](#backend)
      - [Build](#build)
      - [Run](#run)
    - [Frontend](#frontend)
      - [Build](#build-1)
      - [Run](#run-1)

___
## Prerequist  
- [NodeJS 14.18.1](https://nodejs.org/download/release/v14.18.1/])  
- yarn (npm install --global yarn)  

## Folder structure  

* src:
  * librairy : cms engine analyzer src
  * SOE -> Strapi V4 dev environment based on *foodadvisor* template
    * frontend -> foodadvisor frontend.
    * backend -> strapi v4 backend, contains **plugin** cms analyzer plugin (src/plugins/cms-analyzer).  
___

## Build & Run

### Backend:
#### Build
(In backend folder)
> cd src /plugins/cms-analyzer  
> yarn  
> cd ../../..  
> yarn  
> yarn build

#### Run
> yarn admin

### Frontend
#### Build
(in frontend folder)
> yarn  
> yarn build

#### Run
> yarn dev

