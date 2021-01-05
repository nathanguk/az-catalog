module.exports = async function (context, req) {

    const values = req.body.values;
    context.log(values.template);

    const account = process.env.GITHUB_ACCOUNT;
    const repo = process.env.GITHUB_REPO;

    let deployUri = "https://portal.azure.com/#create/Microsoft.Template/uri/";
    let templateUri = encodeURIComponent(`https://raw.githubusercontent.com/${account}/${repo}/master/${values.template}/azuredeploy.json`);
    let location = deployUri + templateUri;

    context.log(location);

    context.res = {
        status: 302, headers: { "location": location }
    };

};