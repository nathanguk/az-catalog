const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const storage = require('@azure/storage-blob');
const storageAccount = process.env.AZURE_STORAGE_ACCOUNT;
const storageKey = process.env.AZURE_STORAGE_KEY;
const storageContainerName = process.env.AZURE_STORAGE_CONTAINER;
const account = process.env.GITHUB_ACCOUNT;
const repo = process.env.GITHUB_REPO;
const gitHubUser = process.env.GITHUB_USER;
const gitHubPat = process.env.GITHUB_PAT;
const gitHubAuth = Buffer.from(`${gitHubUser}:${gitHubPat}`).toString("base64");


module.exports = async function (context, req) {

    try{
        const body = req.body;

        // Log recived parameters
        context.log(JSON.stringify(body.parameters));

        // Get Template from Git and convert to JSON
        const options = {
            method: "GET",
            headers: {
                Authorization: `Basic ${gitHubAuth}`,
            }
        };
        const gitResponse = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${body.template}/azureDeploy.json`, options);
        const gitContents = await gitResponse.json();

        // Convert base64 contents to JSON string
        const templateJson = JSON.parse(Buffer.from(gitContents.content, 'base64').toString('utf8'));


        // Get Parameters from gitResponse Body
        let parameterNames = Object.keys(templateJson.parameters);

        // Update Template with Parameter Values
        parameterNames.forEach(parameterName => {
            templateJson.parameters[parameterName].allowedValues = [body.parameters[parameterName]]
            templateJson.parameters[parameterName].defaultValue = body.parameters[parameterName]
        });
        
        // Call Function to upload template to Azure Blob storage and generate Blob SAS Uri
        let blobUri = await uploadTemplate(context, storageAccount, storageKey, storageContainerName, JSON.stringify(templateJson));

        // Url Encode Blobs SAS Uri
        let templateUri = encodeURIComponent(blobUri);
        let deployUri = "https://portal.azure.com/#create/Microsoft.Template/uri/";

        // Genrate resonse object
        let response = {
            location: deployUri + templateUri
        }

        // Return response
        context.res = {
            status: 200, 
            body: response
        };

    }catch(err){

        console.log(`Error: ${err}`);

        context.res = {
            status: 400, 
            body: `Bad Request: ${err}`
        };
    };

};


// Function to upload template to blob storage
async function uploadTemplate(context, storageAccount, storageKey, storageContainerName, templateString){

    const sharedKeyCredential = new storage.StorageSharedKeyCredential(storageAccount,storageKey);

    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient = new storage.BlobServiceClient(`https://${storageAccount}.blob.core.windows.net`, sharedKeyCredential);

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(storageContainerName);

    // Create a unique name for the blob
    const blobName = `${uuidv4()}.json`;
    context.log(blobName);

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload data to the blob
    const data = templateString;
    await blockBlobClient.upload(data, data.length);

    // Create SAS Token Options
    const sasOptions = {
        containerName: containerClient.containerName,
        blobName: blobName,
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 5 * 60000), // Link Valid for 5 minutes (60000 Miliseconds = 1 Minute)
        permissions: storage.BlobSASPermissions.parse("r")
    }

    // Generate SAS Token
    const sasToken = storage.generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    const blobUri = `${containerClient.getBlockBlobClient(blobName).url}?${sasToken}`;

    return blobUri;

};