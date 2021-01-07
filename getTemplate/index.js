const fetch = require('node-fetch');
const account = process.env.GITHUB_ACCOUNT;
const repo = process.env.GITHUB_REPO;
const gitHubUser = process.env.GITHUB_USER;
const gitHubPat = process.env.GITHUB_PAT;
const gitHubAuth = Buffer.from(`${gitHubUser}:${gitHubPat}`).toString("base64");

module.exports = async function (context, req) {

    if(req.query && req.query.template){

        try{
            const options = {
                method: "GET",
                headers: {
                    Authorization: `Basic ${gitHubAuth}`,
                }
            };
        
            const response = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${req.query.template}/azureDeploy.json`, options);
            const gitContents = await response.json();
        
            const azuredeployJson = JSON.parse(Buffer.from(gitContents.content, 'base64').toString('utf8'));
        
            context.res = {
                status: 200,
                body: azuredeployJson.parameters
            };
    
        }catch(err){

            context.log(err.message);
    
            context.res = {
                status: 500,
                body: "Internal Server Error"
            };     
        };

    }else{
        context.res = {
            status: 400,
            body: "Template must be specified"
        }; 
    };

};
