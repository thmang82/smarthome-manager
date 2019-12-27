var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
 
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
  mode: "development",
  devtool: 'source-map',
  target: "node",
  externals: {
  },
  plugins: [
    new CopyPlugin([]),
  ],
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