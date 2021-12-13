import { terminator, realTimeAnalyses } from "./index";

terminator(["http://localhost:3000"], ['SEO']).then((results) => {
    console.debug("success", results);
}, (err) => {
    console.debug("error on main side", err);
});

realTimeAnalyses([
    {
        tag: "TITLE",
        value: ""
    },
    {
        tag: "META",
        value: "mon test de meta",
        titleValue: "le titre avec la page",
    },
    {
        tag: "H1",
        value: "Final Fantasy 7 Remake Integrade : Square Enix cache le prix du jeu sur PC",
        titleValue: "le titre avec la page",
    }, 
    {
        tag: "H2",
        value: "Zéphyr, ultrasons et patous : l'actu des sciences",
        titleValue: "le titre avec la page",
    }, 
    {
        tag: "H3",
        value: "La pluie d'étoiles filantes des Géminides bat son plein cette nuit !",
        titleValue: "le titre avec la page",
    }, 
    {
        tag: "H4",
        value: "Bon plan Cdiscount : 154 € de remise sur la trottinette électrique pliable Evercross",
        titleValue: "le titre avec la page",
    }, 
]).then(results => {
    results.forEach(item => {
        console.log("errors:", item.errors);
        console.log("warnings:", item.warnings);
    });
}, (err) => {
    console.debug("error on main side", err);
});