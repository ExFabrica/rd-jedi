import { compare }  from 'resemblejs'
//import resemble  from 'nodejs-resemble'
import fs from "mz/fs";
//import { sharp } from "sharp";

export default async function startImageAnalysis(): Promise<any> {
    const frontPath = "./src/image-comparison/front";
    const cmsPath = "./src/image-comparison/cms";
    //get cms images
    fs.readdir(cmsPath, function (cmsErr, cmsFiles) {
        if (cmsErr) return console.log('Unable to scan directory: ' + cmsErr);
        //get front images
        fs.readdir(frontPath, async function (frontErr, frontFiles) {
            if (frontErr) return console.log('Unable to scan directory: ' + frontErr);
            //Analyzing cms images
            cmsFiles.forEach(async function (cmsFilePath) {
                const cmsFile = await fs.readFile(cmsPath + "/" + cmsFilePath);
                const cmsFileName = getFileName(cmsFilePath);
                let imageFound = false;

                frontFiles.forEach(async function (frontFilePath) {
                    if(!imageFound){
                        //1. Compare file names
                        const frontFileName = getFileName(frontFilePath);
                        if(frontFileName.includes(cmsFileName)){
                            console.log("Found same file: " + cmsFileName)
                            imageFound = true;
                        }
                    }
                });

                if(!imageFound){
                    frontFiles.forEach(async function (frontFilePath) {
                        if(!imageFound){
                        //2. If not found, compare 
                            const frontFile = await fs.readFile(frontPath + "/" + frontFilePath);
                            compare(cmsFile, frontFile, options, function (err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("Front : " + frontFilePath + " Cms: " + cmsFilePath  + " match: " + data.misMatchPercentage);
                                    if(data.misMatchPercentage < 4){
                                        console.log("Found same file: " + cmsFileName)
                                        imageFound = true;
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

const getFileName = (file: string): string => {
    const parts = file.split('.');
    const ext = parts[parts.length-1]; 
    return parts.splice(0,parts.length-1).join(".");
}

const options = {
    returnEarlyThreshold: 5,
    scaleToSameSize: true,
    ignoreAntialiasing: true,
    ignoreColors: true
};