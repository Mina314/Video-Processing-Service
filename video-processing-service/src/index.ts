import express from "express";
import ffmpeg from "fluent-ffmpeg"; 

const app = express();

// Middleware to parse request bodies
app.use(express.json());

app.post("/process-video", (req,res) =>{
    // Get path of the input video file from the request body
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    // Create an array to store missing file paths
    const missingFilePaths = [];

    // Check if inputFilePath is missing
    if (!inputFilePath) {
        missingFilePaths.push("inputFilePath");
    }

    // Check if outputFilePath is missing
    if (!outputFilePath) {
        missingFilePaths.push("outputFilePath");
    }

    // If any file path is missing, send an error response
    if (missingFilePaths.length > 0) {
        const errorMessage = `Bad Request: Missing file path(s): ${missingFilePaths.join(", ")}`;
        res.status(400).send(errorMessage);
    }

    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-1:360") //360p
        .on("end",function() {
            console.log('Processing finished successfully');
            res.status(200).send('Processing finished successfully');
        })
        .on("error", function(err: any) {
            console.log(`An error occurred: ${err.message}`);
            res.status(500).send(`Internal Server Error: ${err.message}`);
        })
        .save(outputFilePath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
});

