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

import { addTrustedMessageTypes, port } from "../../core/api/background";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import { getAuthPayload, getPremiumState } from "../../premium/background";

import { type MessageSender } from "../../core/api/background";
import { type Message } from "../../core/api/shared";
import { type PremiumGetAuthPayloadOptions } from "./bypass.types";

/**
 * Algorithm used to verify authenticity of sender
 */
const algorithm = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: "SHA-512" }
};
/**
 * Time (in milliseconds) from now for which we consider signatures to be valid
 * based on their associated timestamps
 */
const signatureExpiration = 60 * 60 * 1000;

/**
 * Converts base64 string into array buffer
 *
 * @param str - base64 string
 *
 * @returns array buffer
 */
function base64ToArrayBuffer(str: string): Uint8Array {
  const decodedData = atob(str);
  return Uint8Array.from(decodedData, (c) => c.charCodeAt(0));
}

/**
 * Encodes request data to sign for verifying authenticity of sender
 *
 * @param domain - Sender domain
 * @param timestamp - Timestamp of current date and time
 *
 * @returns Encoded request data
 */
function getAllowData(domain: string, timestamp: number): Uint8Array {
  const str = `${domain},${timestamp}`;
  return new TextEncoder().encode(str);
}

/**
 * Generates public key from string for verifying signatures
 *
 * @param key - public key string
 *
 * @returns public key
 */
async function getKey(key: string): Promise<CryptoKey> {
  const abKey = base64ToArrayBuffer(key);
  const importedKey = await crypto.subtle.importKey(
    "spki",
    abKey,
    algorithm,
    false,
    ["verify"]
  );
  return importedKey;
}

/**
 * Handles incoming "premium.getAuthPayload" messages
 *
 * @param message - "premium.getAuthPayload" message
 * @param sender - Message sender
 *
 * @returns requested payload
 */
async function handleGetAuthPayloadMessage(
  message: Message,
  sender: MessageSender
): Promise<string | null> {
  if (!isPremiumGetAuthPayloadMessage(message)) {
    return null;
  }

  // Check Premium state
  if (!getPremiumState().isActive) {
    return null;
  }

  // Verify timestamp
  const { signature, timestamp } = message;
  const validTimestamp = verifyTimestamp(timestamp);
  if (!validTimestamp) {
    return null;
  }

  // Verify signature
  if (!sender.tab?.url) {
    return null;
  }
  const domain = new URL(sender.tab.url).hostname;
  if (!domain) {
    return null;
  }
  const validSignature = await verifySignature(domain, timestamp, signature);
  if (!validSignature) {
    return null;
  }

  // Retrieve payload
  const payload = getAuthPayload();
  if (!payload) {
    return null;
  }

  return payload;
}

/**
 * Checks whether candidate is message of type "premium.getAuthPayload".
 *
 * @param candidate - Candidate
 * @returns whether candidate is messag eof type "premium.getAuthPayload"
 */
function isPremiumGetAuthPayloadMessage(
  candidate: unknown
): candidate is PremiumGetAuthPayloadOptions {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "signature" in candidate &&
    "timestamp" in candidate
  );
}

/**
 * Checks whether signature matches data and any of the known public keys
 * that are authorized to use the bypass API
 *
 * @param domain - Sender domain
 * @param timestamp - Timestamp of current date and time
 * @param signature - Signature for provided domain and timestamp
 *
 * @returns whether signature matches data and any authorized public key
 */
async function verifySignature(
  domain: string,
  timestamp: number,
  signature: string
): Promise<boolean> {
  if (typeof signature !== "string") {
    return false;
  }

  const data = getAllowData(domain, timestamp);
  const abSignature = base64ToArrayBuffer(signature);
  const authorizedKeys = Prefs.get("bypass_authorizedKeys") as string[];

  const promisedValidations = authorizedKeys.map(async (key) => {
    return await verifySignatureWithKey(data, abSignature, key);
  });
  const validations = await Promise.all(promisedValidations);
  return validations.some((isValid) => isValid);
}

/**
 * Checks whether signature matches data and public key
 *
 * @param data - Encoded data
 * @param signature - Signature for encoded data
 * @param pubKey - Public key
 *
 * @returns whether signature matches data and public key
 */
async function verifySignatureWithKey(
  data: Uint8Array,
  signature: Uint8Array,
  pubKey: string
): Promise<boolean> {
  return await crypto.subtle.verify(
    algorithm,
    await getKey(pubKey),
    signature,
    data
  );
}

/**
 * Checks whether timestamp is valid
 *
 * @param timestamp - Timestamp
 *
 * @returns whether timestamp is valid
 */
function verifyTimestamp(timestamp: number): boolean {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return false;
  }

  const timeDiff = Date.now() - timestamp;
  return timeDiff < signatureExpiration;
}

/**
 * Initializes module
 */
export function start(): void {
  port.on("premium.getAuthPayload", handleGetAuthPayloadMessage);
  addTrustedMessageTypes(null, ["premium.getAuthPayload"]);
}
