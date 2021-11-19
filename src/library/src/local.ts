import { terminator } from "./index";

terminator(["https://kasty.io/"], ['SEO']).then((results) => {
    console.debug("success", results);
}, (err) => {
    console.debug("error on main side", err);
})