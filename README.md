# az-catalog
AZ Service Catalog Mioddleware

This repo contains Azure Functions written in Node.js, that act as middleware between GitHub and SPA.

## getTemplates

getTemplates returns an array of strings, each string is the name of a top level directory within the GitHub repository.

## getTemplate

getTemplate returns a JSON document that containing the ARM templates parameters. To achive this it uses the GitHub API to retrieve the contents of the azureDeploy.json ARM Template file then returns the parameters property.

## deployTemplate

deployTemplate returns a JSON document that contains a location URL, this URL is used by the browser to redirect the user to the Azure Portal to deploy a generated template.

The Function accepts a POST request that has a JSON body with a paramters object, it merges these paramaters into the source ARM Template and generates a new ARM Template that has the parameters embeded. This file is then save to Azure Blob storage and a SAS URL is generated with a 5 minute expirery time. The SAS URL is thne urlEncodded and used to create the location URL.
