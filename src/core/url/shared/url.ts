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

import { Frame } from "../../../polyfills/shared";

/**
 * Parses the domains part of a filter text
 * (e.g. `example.com,~mail.example.com`) into a `Map` object.
 *
 * @param source The domains part of a filter text.
 * @param separator The string used to separate two or more domains in
 *   the domains part of a filter text.
 *
 * @returns A map
 */
function parseDomains(
  source: string,
  separator: string
): Map<string, boolean> | null {
  let domains;

  if (source[0] !== "~" && !source.includes(separator)) {
    // Fast track for the common one-domain scenario.
    domains = new Map([
      ["", false],
      [source, true]
    ]);
  } else {
    domains = null;

    let hasIncludes = false;
    for (let domain of source.split(separator)) {
      if (domain === "") {
        continue;
      }

      let include;
      if (domain[0] === "~") {
        include = false;
        domain = domain.substring(1);
      } else {
        include = true;
        hasIncludes = true;
      }

      if (!domains) {
        domains = new Map();
      }

      domains.set(domain, include);
    }

    if (domains) {
      domains.set("", !hasIncludes);
    }
  }

  return domains;
}

/**
 * Checks whether the given hostname is an IP address.
 *
 * Unlike `isValidIPv4Address()`, this
 * function only checks whether the hostname _looks like_ an IP address. Use
 * this function with valid, normalized, properly encoded (IDNA) hostnames
 * only.
 *
 * @param hostname An IDNA-encoded hostname.
 *
 * @returns Whether the hostname is an IP address.
 */
function isIPAddress(hostname: string): boolean {
  // Does it look like an IPv6 address?
  if (hostname[0] === "[" && hostname[hostname.length - 1] === "]") {
    return true;
  }

  // Note: The first condition helps us avoid the more expensive regular
  // expression match for most hostnames.
  return (
    Number(hostname[hostname.length - 1]) >= 0 &&
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  );
}

/**
 * Checks whether a given address is a valid IPv4 address.
 *
 * Only a normalized IPv4 address is considered valid. e.g. `0x7f.0x0.0x0.0x1`
 * is invalid, whereas `127.0.0.1` is valid.
 *
 * @param address The address to check.
 *
 * @returns Whether the address is a valid IPv4 address.
 */
function isValidIPv4Address(address: string): boolean {
  return /^(((2[0-4]|1[0-9]|[1-9])?[0-9]|25[0-5])\.){4}$/.test(address + ".");
}

/**
 * Checks whether a given hostname is valid.
 *
 * This function is used for filter validation.
 *
 * A hostname occurring in a filter must be normalized. For example,
 * <code>&#x1f642;</code> (slightly smiling face) should be normalized to
 * `xn--938h`; otherwise this function returns `false` for such a hostname.
 * Similarly, IP addresses should be normalized.
 *
 * @param hostname The hostname to check.
 *
 * @returns Whether the hostname is valid.
 */
function isValidHostname(hostname: string): boolean {
  if (isValidIPv4Address(hostname)) {
    return true;
  }

  // This does not in fact validate the IPv6 address but it's alright for now.
  if (hostname[0] === "[" && hostname[hostname.length - 1] === "]") {
    return true;
  }

  // Based on
  // https://en.wikipedia.org/wiki/Hostname#Restrictions_on_valid_hostnames
  if (hostname[hostname.length - 1] === ".")
    hostname = hostname.substring(0, hostname.length - 1);

  if (hostname.length > 253) return false;

  const labels = hostname.split(".");

  for (const label of labels) {
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) return false;
  }

  // Based on https://tools.ietf.org/html/rfc3696#section-2
  if (!/\D/.test(labels[labels.length - 1])) return false;

  return true;
}

/**
 * Yields all suffixes for a domain.
 *
 * For example, given the domain `www.example.com`, this function yields
 * `www.example.com`, `example.com`, and `com`, in that order.
 *
 * If the domain ends with a dot, the dot is ignored.
 *
 * @param domain The domain.
 * @param includeBlank Whether to include the blank suffix at the
 *   end.
 * @returns A generator yielding domain suffixes.
 */
function* domainSuffixes(domain: string, includeBlank = false) {
  // Since any IP address is already expected to be normalized, there's no need
  // to validate it.
  if (isIPAddress(domain)) {
    yield domain;
  } else {
    if (domain[domain.length - 1] === ".") {
      domain = domain.substring(0, domain.length - 1);
    }

    while (domain !== "") {
      yield domain;

      const dotIndex = domain.indexOf(".");
      domain = dotIndex === -1 ? "" : domain.substr(dotIndex + 1);
    }
  }

  if (includeBlank) {
    yield "";
  }
}

/**
 * Checks whether the tab URL is a match to the domain(s) on the command
 * @param url - the tab URL
 * @param domainList - the domains
 * @returns true if the tab URL is a match to the domain(s) on the command
 */
export function isActiveOnDomain(url: string, domainList?: string): boolean {
  // If no domains are set the rule matches everywhere
  if (!domainList) {
    return true;
  }
  const domains = parseDomains(domainList, ",");
  if (!domains) {
    return true;
  }

  const tabURL = new URL(url);
  let tabDomain = tabURL.hostname;
  if (tabDomain === null) {
    tabDomain = "";
  } else if (tabDomain[tabDomain.length - 1] === ".") {
    tabDomain = tabDomain.substring(0, tabDomain.length - 1);
  }
  // If the document has no host name, match only if the command
  // isn't restricted to specific domains
  if (!tabDomain) {
    return !!domains.get("");
  }

  for (tabDomain of domainSuffixes(tabDomain)) {
    const isDomainIncluded = domains.get(tabDomain);
    if (typeof isDomainIncluded !== "undefined") {
      return isDomainIncluded;
    }
  }

  return !!domains.get("");
}

/**
 * Checks whether a comma separated list of domains using the filter
 * format (e.g. `example.com,~mail.example.com`) contains valid entries.
 *
 * @param list The list to check
 * @returns whether the given list is a valid domain list
 */
export function isDomainList(list: string): boolean {
  const domains = parseDomains(list, ",");

  if (domains === null) {
    // This means the list was empty, what we consider valid
    return true;
  }

  return Array.from(domains.keys()).every(
    (domain) => !domain || isValidHostname(domain)
  );
}

/**
 * Gets the IDN-decoded hostname from the URL of a frame.
 * If the URL don't have host information (like "about:blank"
 * and "data:" URLs) it falls back to the parent frame.
 *
 * @param frame
 * @param originUrl
 * @returns The hostname
 */
export function extractHostFromFrame(frame: Frame, originUrl?: URL): string {
  for (; frame; frame = frame.parent) {
    const { hostname } = frame.url;
    if (hostname) {
      return hostname;
    }
  }

  return originUrl ? originUrl.hostname : "";
}
