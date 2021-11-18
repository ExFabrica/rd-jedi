const analyser = require("./index");

analyser("http://localhost:3000").then((results) => {
    console.debug("success", results);
}, (err) => {
    console.debug("error on main side", err);
})