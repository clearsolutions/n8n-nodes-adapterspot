# Changelog

## 0.2.0

- Vendor-neutral API: Label → Read and the Power Supply operation now return a `requirements` object (exact voltage, minimum current and power, plug, polarity, plain-English rules) instead of product matches.
- Power Supply → "Find" is now shown as "Get Requirements" and calls `/v1/requirements` (the operation value stays `find`, so existing workflows keep working).
- Connector option USB-C added; the Language option now only applies to Label → Read.

## 0.1.1

- No functional changes. Published from GitHub Actions through npm trusted publishing (OIDC) instead of an access token.

## 0.1.0

- First release: Label → Read, Power Supply → Find and Connector → Get Many, with the AdapterSpot API credential.
