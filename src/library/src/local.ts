import { terminator, runSEORealTimeRulesAnalyse } from "./index";

terminator(["http://localhost:3000"], ['SEO']).then((results) => {
    console.debug("success", results);
}, (err) => {
    console.debug("error on main side", err);
});

/*runSEORealTimeRulesAnalyse([
    {
        tag: "TITLE",
        value: "blob of year!",
        identifier:"metaData.title" 
    },
    {
        tag: "META (description)",
        value: "mon test de meta",
        titleValue: "le titre avec la page",
        identifier:"metaData.description" 
    },
    {
        tag: "H1",
        value: "Final Fantasy 7 Remake Integrade : Square Enix cache le prix du jeu sur PC",
        titleValue: "le titre avec la page",
        identifier:"contentSections.0.links.3" 
    },
    {
        tag: "H2",
        value: "Zéphyr, ultrasons et patous : l'actu des sciences",
        titleValue: "le titre avec la page",
        identifier:"contentSections.1.links.4" 
    },
    {
        tag: "H3",
        value: "La pluie d'étoiles filantes des Géminides bat son plein cette nuit !",
        titleValue: "le titre avec la page",
        identifier:"contentSections.2.features.0" 
    },
    {
        tag: "H4",
        value: "Bon plan Cdiscount : 154 € de remise sur la trottinette électrique pliable Evercross",
        titleValue: "le titre avec la page",
        identifier:"contentSections.5.features.2" 
    },
]).then(results => {
    console.log("RT Results:", results);
}, err => {
    console.log("RT analyses error", err);
})*/
