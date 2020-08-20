import { createHmac } from "crypto";
import { encode } from "querystring";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json"));

export function compose(...fns) {
  return (x) => fns.reduceRight((y, f) => f(y), x);
}

export function sortEncode(requestPayload = {}) {
  return encode(requestPayload).split("&").sort().join("&");
}

export function withGlobals(requestPayload = {}) {
  return {
    ...requestPayload,
    SignatureMethod: "HmacSHA256",
    SignatureVersion: "2",
  };
}

export function withAction(Action = "", Version = "") {
  return (requestPayload = {}) => ({
    ...requestPayload,
    Action,
    Version,
  });
}

export function withDate(key = "", date = new Date()) {
  return (requestPayload = {}) => ({
    ...requestPayload,
    [key]: date.toISOString(),
  });
}

export function withList(key = "") {
  return (list = []) => (requestPayload = {}) => {
    const out = { ...requestPayload };
    list.forEach((value, i) => (out[key + (i + 1)] = value));
    return out;
  };
}

export function withSellerInfo({
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

export function withSignature(secretAccessKey = "") {
  return ({ host = "", path = "", method = "POST" } = {}) => (
    requestPayload = {}
  ) => ({
    ...requestPayload,
    Signature: createHmac("sha256", secretAccessKey)
      .update([method, host, path, sortEncode(requestPayload)].join("\n"))
      .digest("base64"),
  });
}

export function withHeaders(
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
      "Content-Length": encode(signedRequestPayload).length,
      "x-amazon-user-agent": `${name}/${version} (Language=JavaScript)`,
    },
  };
}
