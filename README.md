# Project : RD-STRAPI  
- [Project : RD-STRAPI](#project--rd-strapi)
  - [Prerequist](#prerequist)
  - [Folder structure](#folder-structure)
  - [Build](#build)
    - [build modules:](#build-modules)
    - [build Strapi](#build-strapi)

___
## Prerequist  
- [NodeJS 14.18.1](https://nodejs.org/download/release/v14.18.1/])  
- yarn (npm install --global yarn)  

## Folder structure  

src:
 * librairy
   * node_modules
   * src
       * common -> lib common modules used by specific modules
       * i18n -> translate module
       * image-comparaison -> image module
       * seo -> seo module
 * SOE -> Strapi starter use to validate/test
   * extensions -> content-manager
   * plugins -> cms-analyzer


## Build

### build modules:
in src/library
> yarn

### build Strapi
in src/SEO

copy extentions and plugins folder in [starter]/backend to use (eg coorporate)

> cd strapi-starters/[starter]/backend  
> yarn  
> cd plugins/cms-anaylser  
> yarn  
> cd ../..  
> yarn build  
> cd ../frontend  
> yarn