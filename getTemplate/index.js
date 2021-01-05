const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log(req.query);
    const account = process.env.GITHUB_ACCOUNT;
    const repo = process.env.GITHUB_REPO;

    const response = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${req.query.template}/azuredeploy.json`);
    const gitContents = await response.json();

    const azuredeploy = await fetch(gitContents.download_url);
    const azuredeployJson = await azuredeploy.json();


    context.res = {
        status: 200,
        body: azuredeployJson.parameters
    };
}
