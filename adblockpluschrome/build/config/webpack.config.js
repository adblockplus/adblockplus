/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import path from "path";

let tmplLoaderPath = path.resolve("build", "utils", "wp-template-loader.cjs");

export default {
  optimization: {
    minimize: false
  },
  output: {
    path: path.resolve("")
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        resourceQuery: /text/,
        type: "asset/source"
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: false
            }
          }
        ]
      },
      {
        test: /\.html$/,
        resourceQuery: /text/,
        type: "asset/source"
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"]
      },
      {
        test: /\.svg$/,
        resourceQuery: /uri/,
        type: "asset/inline"
      },
      {
        test: /\.woff2$/,
        resourceQuery: /uri/,
        type: "asset/inline"
      }
    ]
  },
  node: {
    global: false
  },
  resolve: {
    modules: [
      path.resolve("lib"),
      path.resolve("../lib"),
      path.resolve("build/templates"),
      "node_modules"
    ]
  },
  resolveLoader: {
    alias: {
      "wp-template-loader": tmplLoaderPath
    }
  }
};
