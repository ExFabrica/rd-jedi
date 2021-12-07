import { terminator } from "./index";

terminator(["http://localhost:3000"], ['SEO']).then((results) => {
    console.debug("success", results.SEO.map(item => item.result.results)
    );

}, (err) => {
    console.debug("error on main side", err);
})