import express from "express";
// import ffmpeg from "fluent-ffmpeg"; 
import { 
    uploadProcessedVideo,
    downloadRawVideo,
    deleteRawVideo,
    deleteProcessedVideo,
    convertVideo,
    setupDirectories
  } from './storage';
  
setupDirectories();

const app = express();
// Middleware to parse request bodies
app.use(express.json());

app.post("/process-video", async (req,res) =>{
    // Get the bucket and filename from the cloud Pub/Sub message. 
    // https://cloud.google.com/pubsub/docs/samples?language=nodejs
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.')
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // Download the raw vide from the cloud storage
    await downloadRawVideo(inputFileName);

    // convert to 360 p
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (err) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);

        return res.status(500).send('Internal Server Error: video processing failed.');
    }

    // upload the processed to the cloud storage
    await uploadProcessedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send('Processing finished successfully');
});

    // *******Storage.ts*******
    // app.post("/process-video", (req,res) =>{
    // // Get path of the input video file from the request body
    // const inputFilePath = req.body.inputFilePath;
    // const outputFilePath = req.body.outputFilePath;

    // // Create an array to store missing file paths
    // const missingFilePaths = [];

    // // Check if inputFilePath is missing
    // if (!inputFilePath) {
    //     missingFilePaths.push("inputFilePath");
    // }

    // // Check if outputFilePath is missing
    // if (!outputFilePath) {
    //     missingFilePaths.push("outputFilePath");
    // }

    // // If any file path is missing, send an error response
    // if (missingFilePaths.length > 0) {
    //     const errorMessage = `Bad Request: Missing file path(s): ${missingFilePaths.join(", ")}`;
    //     res.status(400).send(errorMessage);
    // }

    // ffmpeg(inputFilePath)
    //     .outputOptions("-vf", "scale=-1:360") //360p
    //     .on("end",function() {
    //         console.log('Processing finished successfully');
    //         res.status(200).send('Processing finished successfully');
    //     })
    //     .on("error", function(err: any) {
    //         console.log(`An error occurred: ${err.message}`);
    //         res.status(500).send(`Internal Server Error: ${err.message}`);
    //     })
    //     .save(outputFilePath);


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
});

