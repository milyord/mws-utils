[![Build Status](https://travis-ci.org/milyord/mws-utils.svg?branch=master)](https://travis-ci.org/milyord/mws-utils)
[![Coverage Status](https://coveralls.io/repos/github/milyord/mws-utils/badge.svg?branch=master)](https://coveralls.io/github/milyord/mws-utils?branch=master)

# mws-utils

As the name suggests, this library provides some useful functions for dealing with requests to Amazon's MWS APIs.

Example usage:

```js
import https from "https";
import {
  compose,
  sortEncode,
  withGlobals,
  withAction,
  withDate,
  withList,
  withSellerInfo,
  withSignature,
  withHeaders,
} from "mws-utils";

function getOrdersById(ids = []) {
  const endpointOptions = {
    host: "mws.amazonservices.com",
    path: "/Orders/2013-09-01",
    method: "POST",
  };
  const signedRequestPayload = compose(
    withSignature("SECRET_ACCESS_KEY")(endpointOptions), // You always want to sign last
    withList("AmazonOrderId.Id.")(ids),
    withAction("GetOrder", "2013-09-01"),
    withDate("Timestamp"),
    withSellerInfo({
      AWSAccessKeyId: "AWS_ACCESS_KEY_ID",
      SellerId: "SELLER_ID",
      MWSAuthToken: "MWS_AUTH_TOKEN",
    }),
    withGlobals
  )();
  return [
    sortEncode(signedRequestPayload), // And then url encode if you need to
    withHeaders(signedRequestPayload, endpointOptions),
  ];
}

const [signedRequestPayload, options] = getOrdersById(["SOME_ORDER_ID"]);

const r = https.request(options, (res) => {
  res.setEncoding("utf8");
  let xml = "";
  res.on("data", function (chunk) {
    xml = xml + chunk;
  });
  res.on("end", () => {
    console.log(res.statusCode);
    console.log(xml);
  });
});

r.on("error", (err) => {
  throw err;
});
r.write(signedRequestPayload);
r.end();
```
