const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {

    try{

        const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const storageContainer = process.env.AZURE_STORAGE_CONTAINER;
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

        let templateString = JSON.stringify(templateJson);
        let blobUri = await uploadTemplate(storageConnectionString, storageContainer, JSON.stringify(templateJson));

        let templateUri = encodeURIComponent(blobUri);
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
async function uploadTemplate(storageConnectionString, containerName, templateString){

    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create a unique name for the blob
    const blobName = `${uuidv4()}.json`;

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    context.log(`Uploading to Azure storage as blob: ${blobName}`);

    // Upload data to the blob
    const data = templateString;
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    context.log(`Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`);

    // Create SAS Token Options
    const sasOptions = {
        containerName: containerClient.containerName,
        blobName: blobName
    };

    if (storedPolicyName == null) {
        sasOptions.startsOn = new Date();
        sasOptions.expiresOn = new Date(new Date().valueOf() + 3600 * 1000);
        sasOptions.permissions = BlobSASPermissions.parse("r");
    } else {
        sasOptions.identifier = storedPolicyName;
    }

    // Generate SAS Token
    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    context.log(`SAS token for blob is: ${sasToken}`);

    return `${containerClient.getBlockBlobClient(blobName).url}?${sasToken}`;

};