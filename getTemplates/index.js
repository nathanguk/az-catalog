const fetch = require('node-fetch');
const account = process.env.GITHUB_ACCOUNT;
const repo = process.env.GITHUB_REPO;
const folders = process.env.GITHUB_EXCLUDE;
const excludedFolders = folders.split(",");
const gitHubUser = process.env.GITHUB_USER;
const gitHubPat = process.env.GITHUB_PAT;
const gitHubAuth = Buffer.from(`${gitHubUser}:${gitHubPat}`).toString("base64");

module.exports = async function (context, req) {

    try{
        // Get folders from Git
        const options = {
            method: "GET",
            headers: {
                Authorization: `Basic ${gitHubAuth}`,
            }
        };

        const response = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/`, options);
        const gitContents = await response.json();
    
        // Filter out specified folders
        let templates = [];
    
        gitContents.filter(function (template) {
            if(template.type == "dir" && !excludedFolders.includes(template.name)){
                context.log(template.path);

                let armViz = `http://armviz.io/#/?load=`
                let rawUrl = encodeURIComponent(`https://raw.githubusercontent.com/${account}/${repo}/master/${template.path}/azureDeploy.json`)

                templateObject = {
                    name: template.path,
                    visualize: armViz + rawUrl
                }
                
                templates.push(templateObject);
                return
            };
        });
    
        // Retunr response
        context.res = {
            status: 200,
            body: templates
        };

    }catch(err){

        context.log(err.message);
        
        context.res = {
            status: 500,
            body: "Internal Server Error"
        }; 

    };

};
