import { compare }  from 'resemblejs'
//import resemble  from 'nodejs-resemble'
import fs from "mz/fs";
//import { sharp } from "sharp";

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

                //1. resemblejs
                compare(file1, file2, options, function (err, data) {
                    if (err) {
                        console.log(err);
                        //const file1_redim = sharp(file1).resize({width: 300, height: 200}).toBuffer()
                        //const file2_redim = sharp(file2).resize({width: 300, height: 200}).toBuffer()

                        //2. Node-resemble
                        // const diff = resemble(file1).compareTo(file2).ignoreColors().onComplete(function(data){
                        //     console.log("Front : " + frontFile + " Cms: " + cmsFile  + " match: " + data.misMatchPercentage);
                        // });
                    } else {
                        console.log("Front : " + frontFile + " Cms: " + cmsFile  + " match: " + data.misMatchPercentage);
                    }
                });
            });
        });
        });
    });
}
