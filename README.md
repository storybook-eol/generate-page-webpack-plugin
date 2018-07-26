# Generate Page Webpack Plugin

Generate HTML-pages for every webpack entrypoint

## Install

```sh
npm install generate-page-webpack-plugin --dev --save
```
```sh
yarn add generate-page-webpack-plugin --dev
```

## Add to your webpack config

```js // webpack.config.js
export const config = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    page1: ['pages/page1.js'],
    page2: ['pages/page2.js'],
  },
  plugins: [
    new GeneratePagePlugin(
      {
        template: require.resolve('../templates/index.html.ejs'),
        parser: require('ejs'),
      },
      {
        data: {
          awesome: true,
        },
      }
    ),
  ],
};
```

## Api

`GeneratePagePlugin` takes 2 parameters: 

### Config

Config is data the plugin needs to operate, it will not be passed to them template

- **parser** - *required* - should be a ejs like module that can `compile` and invoke templates
- **template** - *required* - the template to use to generate pages
- **filename** - *optional* - should be a function that takes the entrypoint name and returns a name for the html-file.

Properties *have no default*, so if they are required you must supply them!

### Options

Options are datapoints that are used when generating the template, they are passed to the template.

If the value of a option is a function, it will be invoked with the name of the entry, so you can change the options per entry!

You can set whatever options you want here, you're totally free to make up your own data (different per entry is possible) and inject it into the template.

Here's a few suggestions:

- **headHtmlSnippet** - inject some html into the head
- **footHtmlSnippet** - inject some html into the foot
- **script** - inject scripts
- **window** - inject global scope variables
- **title** - meta title for the page

## Templates

Templates can be in whatever syntax you like, if you supply a parser for them.
We do not ship with a parser or template included.

### Rendering chunks and options

The template will be provided with the data which is a combination of:

- the webpack entrypoint reference
  **values are accessible as global variables** The most useful is likely `chunks`.

- the webpack compilation
  **values are available under a variable called `compilation`**.
- the dlls needed for the entrypoint
  **values are available under a variable called `dlls`**.
  Dlls are and advanced use-case but with this plugin there should be no special setup required for them to be injected into the template. __But you do need to render them in the template__ (see example).
- the options
  **values are available under a variable called `options`**.
  If the option was a function in the webpack config, by the time the data is injected into the template it will have been called and whatever the function returned for that property, that's what's injected into the template.

### Template example

```ejs
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <title><%= options.title %></title>
    <link rel="shortcut icon" href="favicon.ico" />
  
    <% if (options.headHtmlSnippet) { %>
      <%- options.headHtmlSnippet %>
    <% } %>
  
</head>
<body>
    
    <% if (options.window) { %>
      <script>
        <% for (key in options.window) { %>
          window['<%= key %>'] = <%= JSON.stringify(options.window[key]) %>;
        <% } %>
      </script>
    <% } %>

    <% if (options.bodyHtmlSnippet) { %>
      <%- options.bodyHtmlSnippet %>
    <% } %>
  
    <div id="root"></div>

    <% for (key in dlls) { %>
      <script src="<%= compilation.outputOptions.publicPath %><%= dlls[key] %>" defer></script>
    <% } %>
  
    <% for (index in chunks) { %>
      <% for (key in chunks[index].files) { %>
        <script src="<%= compilation.outputOptions.publicPath %><%= chunks[index].files[key] %>" defer></script>
      <% } %>
    <% } %>
  
</body>
</html>
```

## Contributing

All contributions are welcome!
