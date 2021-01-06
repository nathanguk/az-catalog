const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const storage = require('@azure/storage-blob');

module.exports = async function (context, req) {

    try{

        const storageAccount = process.env.AZURE_STORAGE_ACCOUNT;
        const storageKey = process.env.AZURE_STORAGE_KEY;
        const storageContainerName = process.env.AZURE_STORAGE_CONTAINER;
        const account = process.env.GITHUB_ACCOUNT;
        const repo = process.env.GITHUB_REPO;
        const body = req.body;

        // Get Template from Git and convert to JSON
        const gitResponse = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${body.template}/azureDeploy.json`);
        const gitContents = await gitResponse.json();
        const templateJson = JSON.parse(Buffer.from(gitContents.content, 'base64').toString('utf8'));

        // Get Parameters from Request Body
        let parameterNames = Object.keys(templateJson.parameters);
        context.log(parameterNames);

        // Update Template with Parameter Values
        parameterNames.forEach(parameterName => {
            templateJson.parameters[parameterName].allowedValues = [body.parameters[parameterName]]
            templateJson.parameters[parameterName].defaultValue = body.parameters[parameterName]
        });
        
        let blobUri = await uploadTemplate(context, storageAccount, storageKey, storageContainerName, JSON.stringify(templateJson));        
        context.log(blobUri);

        let templateUri = encodeURIComponent(blobUri);
        context.log(templateUri);

        let deployUri = "https://portal.azure.com/#create/Microsoft.Template/uri/";

        let response = {
            location: deployUri + templateUri
        }

        context.res = {
            status: 200, 
            body: response
        };

    }catch(err){

        console.log(`Error: ${err}`);

        context.res = {
            status: 400, 
            body: "Bad Request"
        };
    };

};


// Function to upload template to blob storage
async function uploadTemplate(context, storageAccount, storageKey, storageContainerName, templateString){

    const sharedKeyCredential = new storage.StorageSharedKeyCredential(storageAccount,storageKey);
    context.log(sharedKeyCredential);

    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient = new storage.BlobServiceClient(`https://${storageAccount}.blob.core.windows.net`, sharedKeyCredential);
    context.log("1");

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(storageContainerName);
    context.log("2");

    // Create a unique name for the blob
    const blobName = `${uuidv4()}.json`;
    context.log(blobName);

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    context.log("3");

    // Upload data to the blob
    const data = templateString;
    await blockBlobClient.upload(data, data.length);
    context.log("4");

    // Create SAS Token Options
    const sasOptions = {
        containerName: containerClient.containerName,
        blobName: blobName,
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
        permissions: storage.BlobSASPermissions.parse("r")
    }

    // Generate SAS Token
    const sasToken = storage.generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    context.log("5");

    const blobUri = `${containerClient.getBlockBlobClient(blobName).url}?${sasToken}`;
    context.log(blobUri);

    return blobUri;

};