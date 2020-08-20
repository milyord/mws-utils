import { expect } from "chai";
import deepFreeze from "deep-freeze";
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
} from "../src/main";

describe("main.js", () => {
  it("withGlobals", () => {
    const payload = { test: "withGlobals" };
    deepFreeze(payload);
    expect(withGlobals(payload)).to.eql({
      ...payload,
      SignatureMethod: "HmacSHA256",
      SignatureVersion: "2",
    });
  });
  it("withAction", () => {
    const payload = { test: "withAction" };
    deepFreeze(payload);
    expect(withAction(1, 2)(payload)).to.eql({
      ...payload,
      Action: 1,
      Version: 2,
    });
  });
  it("withDate default params", () => {
    const payload = { test: "withDate" };
    deepFreeze(payload);
    const withTimestamp = withDate("Timestamp");
    expect(withTimestamp).to.be.a("function");
    expect(withTimestamp(payload).Timestamp).to.be.a("string").with.length(24);
  });
  it("withDate with params", () => {
    const payload = { test: "withDate" };
    const now = new Date();
    deepFreeze(payload);
    expect(withDate("Timestamp", now)(payload).Timestamp)
      .to.be.a("string")
      .with.length(24)
      .and.to.equal(now.toISOString());
  });
  it("withList", () => {
    const payload = { test: "withList" };
    deepFreeze(payload);
    const withMarketplaceIds = withList("MarketplaceId.Id.");
    expect(withMarketplaceIds).to.be.a("function");
    expect(withMarketplaceIds(["id1", "id2"])(payload)).to.eql({
      ...payload,
      "MarketplaceId.Id.1": "id1",
      "MarketplaceId.Id.2": "id2",
    });
  });
  it("withSellerInfo", () => {
    const payload = { test: "withSellerInfo" };
    const sellerInfo = {
      AWSAccessKeyId: "awsakid",
      SellerId: "sellerid",
      MWSAuthToken: "mwsatoken",
    };
    deepFreeze(payload);
    expect(withSellerInfo(sellerInfo)(payload)).to.eql({
      ...payload,
      ...sellerInfo,
    });
  });
  it("withSignature", () => {
    const payload = { test: "withSignature" };
    deepFreeze(payload);
    const defaultOptions = {
      host: "mws.amazonservices.com",
      path: "/Orders/2013-09-01",
      method: "POST",
    };
    const withKey = withSignature("key");
    expect(withKey).to.be.a("function");
    const withOptions = withKey(defaultOptions);
    expect(withOptions).to.be.a("function");
    expect(withOptions(payload)).to.eql({
      ...payload,
      Signature: "mgpwoxjk/ZVrlOGA1AGEfyVtGyjvooHsh5tK91bqbiM=",
    });
  });
  it("withHeaders", () => {
    const signedPayload = {
      test: "withHeaders",
      Signature: "mgpwoxjk/ZVrlOGA1AGEfyVtGyjvooHsh5tK91bqbiM=",
    };
    deepFreeze(signedPayload);
    const defaultOptions = {
      host: "mws.amazonservices.com",
      path: "/Orders/2013-09-01",
      method: "POST",
    };
    const [name, version] = ["test-app", "1.0"];
    const requestHeaders = withHeaders(
      signedPayload,
      defaultOptions,
      name,
      version
    );
    expect(requestHeaders).to.eql({
      ...defaultOptions,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": 75,
        "x-amazon-user-agent": `${name}/${version} (Language=JavaScript)`,
      },
    });
  });
  it("compose", () => {
    const defaultOptions = {
      host: "mws.amazonservices.com",
      path: "/Orders/2013-09-01",
      method: "POST",
    };
    function getOrdersById(ids = []) {
      return compose(
        sortEncode, // url encode
        withList("AmazonOrderId.Id.")(ids),
        withAction("GetOrder", "2013-09-01"),
        withDate("Timestamp", new Date("01/01/2020")), // freeze timestamp for testing
        withSellerInfo({
          AWSAccessKeyId: "awsakid",
          SellerId: "sellerid",
          MWSAuthToken: "mwsatoken",
        }),
        withGlobals
      )();
    }
    expect(getOrdersById(["id1", "id2"])).to.equal(
      sortEncode({
        Timestamp: new Date("01/01/2020").toISOString(),
        "AmazonOrderId.Id.1": "id1",
        "AmazonOrderId.Id.2": "id2",
        SignatureMethod: "HmacSHA256",
        SignatureVersion: "2",
        AWSAccessKeyId: "awsakid",
        SellerId: "sellerid",
        MWSAuthToken: "mwsatoken",
        Action: "GetOrder",
        Version: "2013-09-01",
      })
    );
  });
  it("sortEncode", () => {
    const payload = {
      AWSAccessKeyId: "awsakid",
      SellerId: "sellerid",
      MWSAuthToken: "mwsatoken",
    };
    expect(
      sortEncode(payload)
        .split(/\=\w*\&?/g)
        .slice(0, -1)
    ).to.eql(Object.keys(payload).sort());
  });
});
