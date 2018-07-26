"use strict";

module.exports = (amount = 50) =>
{
  const list = new Array(amount);
  while (amount-- > 0)
  {
    const text = randomString();
    list[amount] = {
      disabled: Math.random() < 0.5,
      slow: text.indexOf("/") > -1,
      text
    };
  }
  return list;
};

function randomString()
{
  let length = 5 + Math.round(Math.random() * 45);
  const output = new Array(length);
  while (length-- > 0)
    output[length] = String.fromCharCode(48 + Math.round(Math.random() * 74));
  return output.join("");
}
