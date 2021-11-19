import { compare }  from 'resemblejs'
import fs from "mz/fs";

export default async function startImageAnalysis(): Promise<any> {
    const frontPath = "./src/image-comparison/front";
    const cmsPath = "./src/image-comparison/cms";
    fs.readdir(frontPath, function (frontErr, frontFiles) {
        if (frontErr) return console.log('Unable to scan directory: ' + frontErr);
        
        frontFiles.forEach(function (frontFile) {
            fs.readdir(cmsPath, async function (cmsErr, cmsFiles) {
            if (cmsErr) return console.log('Unable to scan directory: ' + cmsErr);
            
            const file1 = await fs.readFile(frontPath + "/" + frontFile);
            cmsFiles.forEach(async function (cmsFile) {
                const file2 = await fs.readFile(cmsPath + "/" + cmsFile);

                const options = {
                    returnEarlyThreshold: 5,
                    scaleToSameSize: true,
                    ignoreAntialiasing: true,
                    ignoreColors: true
                };

                compare(file1, file2, options, function (err, data) {
                    if (err) {
                        console.log("An error!");
                    } else {
                        console.log("Front : " + frontFile + " Cms: " + cmsFile  + " match: " + data.misMatchPercentage);
                    }
                });
            });
        });
        });
    });
}
