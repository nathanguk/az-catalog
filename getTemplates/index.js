const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log(req.query);
    const account = process.env.GITHUB_ACCOUNT;
    const repo = process.env.GITHUB_REPO;

    let response = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/`);
    const gitContents = await response.json();

    context.log(gitContents);

    let templates = [];

    gitContents.filter(function (template) {
        if(template.type == "dir" && template.name != ".github"){
            templates.push(template.path);
            return 
        };
    });


    context.res = {
        status: 200,
        body: templates
    };
}
