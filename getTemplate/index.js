const fetch = require('node-fetch');

module.exports = async function (context, req) {

    if(req.query && req.query.template){

        try{

            const account = process.env.GITHUB_ACCOUNT;
            const repo = process.env.GITHUB_REPO;
        
            const response = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${req.query.template}/azureDeploy.json`);
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
