var path = require('path');
const nodeExternals = require('webpack-node-externals');
// const CopyPlugin = require('copy-webpack-plugin');
 
module.exports = {
  context: __dirname + "/js_out",
    // the main source code file
  entry:{
    app: ["./server.js"]
  },                  
  output: {
    // the output file name
    filename: './server.js',
    // the output path               
    path: path.resolve(__dirname, 'dist')
  },
  externals: [ nodeExternals() ],
  mode: "development",
  devtool: 'source-map',
  target: "node",
  plugins: [],
  module: {
    rules: [
      // all files with a `.ts` extension will be handled by `ts-loader`
      { test: /\.ts$/, loader: 'ts-loader' },
      {
        test: /\.(js|mjs|jsx)$/,
        loader: 'string-replace-loader',
        options: {
          search: '#!/usr/bin/env node',
          replace: '',
        }
      }
    ]
  }
};