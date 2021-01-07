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

        const options = {
            method: "GET",
            headers: {
                Authorization: `Basic ${gitHubAuth}`,
            }
        };

        const response = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/`, options);
        const gitContents = await response.json();
    
        let templates = [];
    
        gitContents.filter(function (template) {
            if(template.type == "dir" && !excludedFolders.includes(template.name)){
                context.log(template.path);
                templates.push(template.path);
                return
            };
        });
    
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
