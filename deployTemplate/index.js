module.exports = async function (context, req) {

    const values = req.body.values;
    context.log(values);

    const account = process.env.GITHUB_ACCOUNT;
    const repo = process.env.GITHUB_REPO;

    let deployUri = "https://portal.azure.com/#create/Microsoft.Template/uri/";
    let templateUri = encodeURIComponent(`https://raw.githubusercontent.com/${account}/${repo}/master/${values.template}/azureDeploy.json`);
    //let location = deployUri + templateUri;
    let response = {
        location: deployUri + templateUri
    }

    context.res = {
        status: 200, 
        body: response
    };

};