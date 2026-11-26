# n8n-nodes-adapterspot

This is an n8n community node for the [Power Adapter Label Reader API](https://adapterspot.com/en/api/).

Send a photo of a power adapter label (or the rating plate on a device) and get the output voltage, current, wattage, connector type and polarity back as structured data, plus the requirements a replacement power supply must meet (exact voltage, minimum current and power, plug, polarity and plain-English rules). The API is built and run by AdapterSpot.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Usage](#usage)
- [Example workflows](#example-workflows)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-adapterspot`.

## Operations

| Resource | Operation | What it does | Quota |
|---|---|---|---|
| Label | Read | Reads a power adapter label from a photo in a binary field: voltage, current, wattage, connector, polarity, brand/model when printed, and the requirements for a replacement. | Counts toward the free monthly quota |
| Power Supply | Get Requirements | Returns the requirements for a replacement power supply, given at least two of voltage, current and power, and optionally the connector and polarity. | Free |
| Connector | Get Many | Lists the connector types the API recognises (one item per connector). | Free |

The node can also be used as a tool by the n8n AI Agent (the Power Supply and Connector operations work without binary input).

## Credentials

1. Get a free API key at <https://adapterspot.com/en/api/#key>. The key is sent to your e-mail address. The free tier includes 10 label reads per month; requirement lookups and the connector list do not count.
2. In n8n, create a new **AdapterSpot API** credential and paste the key into **API Key**.
3. Click **Test** to check the key.

The key is sent in the `X-API-Key` header.

## Usage

### Label → Read

- **Input Binary Field**: the binary field that holds the photo (default `data`). Supported: JPEG, PNG and WebP up to about 3.7 MB; 1600 px on the long side is plenty.
- **Options → Language**: `en`, `nl` or `fr` for the note.

Output (shortened):

```json
{
  "readable": true,
  "confidence": "high",
  "model": "ADS-60SG-12-2 12060G",
  "output": { "voltage_v": 12, "current_a": 5, "power_w": 60, "computed_field": null, "polarity": "center_positive" },
  "connector": { "id": null, "name": null, "printed": null, "seen_in_photo": "not_visible" },
  "requirements": {
    "voltage_v": 12, "min_current_a": 5, "min_power_w": 60,
    "connector": null, "polarity": "center_positive", "complete": false,
    "rules": ["Use exactly 12 V DC. A different voltage can damage the device.", "Current rating at least 5 A (60 W). A higher rating is safe: the device only draws what it needs.", "Plug size unknown: measure the plug or the socket on the device (common sizes: 5.5 × 2.1 mm, 5.5 × 2.5 mm, 3.5 × 1.35 mm).", "Polarity: center positive (+ on the inner pin)."]
  },
  "usage": { "month": "2026-11", "label_reads_used": 1, "label_reads_quota": 10, "label_reads_left": 9 }
}
```

- `output.computed_field` tells you which value was calculated from the other two (labels often print only volts and amps).
- `connector.seen_in_photo` is what the photo shows: `barrel`, `din_4pin`, `usb_c`, `other` or `not_visible`.
- `requirements.complete` is true when voltage, current, connector and polarity are all known; `requirements.rules` says the same in plain English. `requirements` is `null` when the label was not readable.

### Power Supply → Get Requirements

Fill in at least two of **Voltage (V)**, **Current (A)** and **Power (W)**. Under **Additional Fields** you can add the **Connector** (including USB-C) and **Polarity**. The output has the same `requirements` object as Label → Read. A power supply always needs the same voltage and polarity; an equal or higher current rating is safe.

### Errors

With **Continue On Fail** enabled, errors are returned as `{ "error": "..." }` items. Common causes: an invalid key (401), the monthly quota used up (429), a photo that cannot be read (422) or an unsupported file type.

## Example workflows

**Helpdesk photo → specs**
1. **Form Trigger** with a file field where a colleague uploads a photo of the adapter label.
2. **AdapterSpot** → Label → Read, with **Input Binary Field** set to the form's file field.
3. **Slack**, **Email** or your ticketing node: post `output.voltage_v`, `output.current_a`, `connector.name` and the lines of `requirements.rules`.

**Spreadsheet of devices → power supply requirements**
1. **Google Sheets** (or any source) with columns for volts and amps.
2. **AdapterSpot** → Power Supply → Get Requirements, with **Voltage** and **Current** set from the row via expressions.
3. Write `requirements.min_current_a`, `requirements.connector.name` and `requirements.rules` back to the sheet.

**Photo from an inbox**
1. **Email Trigger (IMAP)** with "Download Attachments" enabled.
2. **AdapterSpot** → Label → Read on the attachment field (for example `attachment_0`).

## Compatibility

Built with the `@n8n/node-cli` tooling (n8n node API version 1). No runtime dependencies.

## Resources

- [API documentation](https://adapterspot.com/en/api/)
- [OpenAPI description](https://api.adapterspot.com/v1/openapi.json)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Support: info@adapterspot.com

## License

[MIT](LICENSE). Maintained by AdapterSpot (Clear Solutions BV, Essen, Belgium).
