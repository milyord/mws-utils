'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crypto = require('crypto');
var querystring = require('querystring');
var fs = require('fs');

const pkg = JSON.parse(fs.readFileSync("package.json"));

function compose(...fns) {
  return (x) => fns.reduceRight((y, f) => f(y), x);
}

function sortEncode(requestPayload = {}) {
  return querystring.encode(requestPayload).split("&").sort().join("&");
}

function withGlobals(requestPayload = {}) {
  return {
    ...requestPayload,
    SignatureMethod: "HmacSHA256",
    SignatureVersion: "2",
  };
}

function withAction(Action = "", Version = "") {
  return (requestPayload = {}) => ({
    ...requestPayload,
    Action,
    Version,
  });
}

function withDate(key = "", date = new Date()) {
  return (requestPayload = {}) => ({
    ...requestPayload,
    [key]: date.toISOString(),
  });
}

function withList(key = "") {
  return (list = []) => (requestPayload = {}) => {
    const out = { ...requestPayload };
    list.forEach((value, i) => (out[key + (i + 1)] = value));
    return out;
  };
}

function withSellerInfo({
  AWSAccessKeyId = "",
  SellerId = "",
  MWSAuthToken = "",
} = {}) {
  return (requestPayload = {}) => ({
    ...requestPayload,
    AWSAccessKeyId,
    SellerId,
    MWSAuthToken,
  });
}

function withSignature(secretAccessKey = "") {
  return ({ host = "", path = "", method = "POST" } = {}) => (
    requestPayload = {}
  ) => ({
    ...requestPayload,
    Signature: crypto.createHmac("sha256", secretAccessKey)
      .update([method, host, path, sortEncode(requestPayload)].join("\n"))
      .digest("base64"),
  });
}

function withHeaders(
  signedRequestPayload = {},
  requestOptions = {},
  name = pkg.name,
  version = pkg.version
) {
  return {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": querystring.encode(signedRequestPayload).length,
      "x-amazon-user-agent": `${name}/${version} (Language=JavaScript)`,
    },
  };
}

exports.compose = compose;
exports.sortEncode = sortEncode;
exports.withAction = withAction;
exports.withDate = withDate;
exports.withGlobals = withGlobals;
exports.withHeaders = withHeaders;
exports.withList = withList;
exports.withSellerInfo = withSellerInfo;
exports.withSignature = withSignature;
