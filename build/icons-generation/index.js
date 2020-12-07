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

"use strict";

const nodeCanvas = require("canvas");
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const {promisify} = require("util");

const fsWriteFile = promisify(fs.writeFile);

const baseIcons = {
  abp: {width: 59, height: 25},
  background: {width: 64, height: 64},
  bell: {width: 32, height: 46}
};
const iconSizes = [16, 20, 32, 40];
const iconVariants = [
  {type: "default", content: "abp", color: "ED1E45"},
  {type: "disabled", content: "abp", color: "A7A7A7"},
  {type: "notification", content: "bell", color: "0797E1"}
];
const inputDir = "skin/icons/toolbar";
const outputDir = inputDir;

function hexToRGB(hex)
{
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

function setColor(ctx, width, height, hexColor)
{
  const rgbColor = hexToRGB(hexColor);
  const imageData = ctx.getImageData(0, 0, width, height);
  const {data} = imageData;
  const len = data.length;

  for (let i = 0; i < len; i += 4)
  {
    if (data[i + 3] === 0)
      continue;

    data[i] = rgbColor[0];
    data[i + 1] = rgbColor[1];
    data[i + 2] = rgbColor[2];
  }

  ctx.putImageData(imageData, 0, 0);
}

async function loadImage(name)
{
  const filepath = path.join(inputDir, `${name}.svg`);
  return nodeCanvas.loadImage(filepath);
}

function optimizePNG(filepath)
{
  return new Promise((resolve, reject) =>
  {
    const proc = childProcess.spawn(
      "npm",
      ["run", "$", "optimize.png", filepath]
    );
    proc.on("close", (code) =>
    {
      if (code)
      {
        reject(`Failed to optimize PNG file: ${filepath}`);
        return;
      }

      resolve();
    });
  });
}

async function createIcon(variant, size)
{
  const {color, content, type} = variant;
  const {
    width: bgWidth,
    height: bgHeight
  } = baseIcons.background;
  const {
    width: contentWidth,
    height: contentHeight
  } = baseIcons[content];

  const canvas = nodeCanvas.createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.scale(size / bgWidth, size / bgHeight);

  const bgImage = await loadImage("background");
  ctx.drawImage(bgImage, 0, 0, bgWidth, bgHeight);
  setColor(ctx, bgWidth, bgHeight, color);

  const canvasContent = nodeCanvas.createCanvas(contentWidth, contentHeight);
  const ctxContent = canvasContent.getContext("2d");

  const contentImage = await loadImage(content);
  ctxContent.drawImage(contentImage, 0, 0, contentWidth, contentHeight);
  setColor(ctxContent, contentWidth, contentHeight, "FFFFFF");

  ctx.drawImage(
    canvasContent,
    (bgWidth - contentWidth) / 2,
    (bgHeight - contentHeight) / 2,
    contentWidth,
    contentHeight
  );

  const outputFilepath = path.join(outputDir, `${type}-${size}.png`);
  const pngBuffer = canvas.toBuffer();
  await fsWriteFile(outputFilepath, pngBuffer);
  await optimizePNG(outputFilepath);
  // eslint-disable-next-line no-console
  console.log(`Created icon ${outputFilepath}`);
}

function createIcons()
{
  const promises = [];
  for (const variant of iconVariants)
  {
    for (const size of iconSizes)
    {
      promises.push(createIcon(variant, size));
    }
  }
  return Promise.all(promises);
}

createIcons()
  .catch((err) =>
  {
    console.error(err);
    process.exit(1);
  });
