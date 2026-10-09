# Zabbix template for FS S5850-24B4C

Community-maintained monitoring template for the **FS S5850-24B4C** network switch. It combines proprietary SNMP OIDs with a *single* read-only SSH query to monitor hardware health in **Zabbix 7.4**.

> **Compatibility:** Tested by the original contributor on **FS S5850-24B4C**, **FSOS 7.5.5**, **Zabbix 7.4**. Other FS switches, firmware releases and Zabbix versions are **not verified**. This is not an official FS.com template.

## What is monitored

| Method | Metric | Notes |
| --- | --- | --- |
| SNMP | CPU utilization (3 windows) | CPU window labels 5s/1m/5m are inferred, not confirmed against an official MIB. |
| SNMP | Used memory (%) | Calculated as `100 - free memory (%)`. |
| SNMP | FSOS firmware version | Text string. |
| SSH | Fan health | Eight expected fan *entries* (`1-1` to `2-4`); alerts if an entry is missing or unhealthy. |
| SSH | Minimum fan speed (%) | Percentage, **not RPM**. |
| SSH | Power-supply health | Two expected PSU entries; flags missing/not-PRESENT/non-OK/Alert=YES. |
| SSH | Power consumption for PSU 1/2 | Watt readings when available. |
| SSH | Two temperatures | `AROUND_CHIP` and `SWITCH_CHIP` in °C. |
| SSH | Missing temperature sensors | Alerts if either expected sensor index is missing. |
| Both | Missing monitoring data | Alerts if SSH-dependent health or SNMP CPU/RAM items stop reporting. |

The template **does not** provide network-interface discovery. Assign **Network Generic Device by SNMP** separately if you want interface traffic, link status, and other general monitoring.

## Installation

1. Ensure that your Zabbix server (or the host's assigned proxy) can reach the switch's management address on **UDP 161** (SNMP) and **TCP 22** (SSH). The Zabbix server/proxy must support SSH checks.
2. Enable SNMP on the switch and configure the appropriate **SNMP interface** and credentials on the Zabbix host. Consider SNMPv3 where supported.
3. Create a **dedicated monitoring-only SSH user** with the least privilege that permits `show environment`. On the tested FSOS 7.5.5 device, the command worked at user privilege level **1**. **Verify separately** that your monitoring user cannot enter configuration mode or run write commands; privileges may differ by firmware.
4. Confirm non-interactive SSH works from the monitoring server or proxy:
   ```sh
   ssh -T zabbix-mon@SWITCH_IP 'show environment'
   ```
5. In Zabbix, open **Data collection → Templates → Import**, select [`template_fs_s5850_24b4c_zabbix_7.4.xml`](template_fs_s5850_24b4c_zabbix_7.4.xml), and import. You may need to create or select the **Templates/Network devices** group depending on your existing configuration.
6. Link the template **FS S5850-24B4C by SNMP and SSH** to your switch host. Optionally also link **Network Generic Device by SNMP**.
7. Under **Data collection → Hosts → _your switch_ → Macros**, add the following **host-level** macros (they are intentionally *not* populated by the template):

   | Macro | Value | Zabbix macro type |
   | --- | --- | --- |
   | `{$FS.SSH.IP}` | Switch management IP address | Text |
   | `{$FS.SSH.USER}` | Dedicated read-only monitoring login | Text |
   | `{$FS.SSH.PASSWORD}` | That user's SSH password | **Secret text** |

8. Open **Monitoring → Latest data** and check the `FS: Environment raw data` item. It should contain JSON after the SSH item has run; its dependent hardware items should also populate. SSH polling runs every **5 minutes**. The firmware item polls hourly.

**Upgrading an existing installation:** The template's technical name, item keys and original UUIDs are preserved so Zabbix can update an existing import of this template. The display name changes. Import with **Update existing** and **Create new**. Do **not** select **Delete missing** if your template includes locally added items you wish to retain. Verify the new temperature-sensor health item after upgrading.

## Triggers

- **High:** fan failure, PSU failure, missing temperature sensor, sustained CPU usage above 90%, sustained used memory above 90%, high chip temperatures.
- **Disaster:** temperature reaches the corresponding critical limit.
- **Warning:** hardware-monitoring data absent for 20 minutes, or either CPU 5s / used-memory SNMP item absent for 15 minutes.

The temperature thresholds default to the tested device's `show environment` output and can be overridden using **template-level macros** (or host-level overrides):

| Temperature sensor | High | Disaster |
| --- | ---: | ---: |
| `AROUND_CHIP` (index 1) | `{$FS.TEMP.AROUND.HIGH}` = 65 °C | `{$FS.TEMP.AROUND.CRIT}` = 80 °C |
| `SWITCH_CHIP` (index 2) | `{$FS.TEMP.SWITCH.HIGH}` = 100 °C | `{$FS.TEMP.SWITCH.CRIT}` = 110 °C |

High temperature triggers apply below the Disaster threshold, so they do not stay active alongside the critical event. Override the four template macros if your specific device reports different limits. Ensure each high threshold is lower than its corresponding critical threshold.

## Reliability and limitations

The SSH item runs **one** `show environment` command. JavaScript preprocessing parses fan, PSU and sensor sections into JSON, then dependent items extract individual measurements. The parser expects the tested model's hardware arrangement: **eight fan entries, two PSUs, two temperature sensor indexes**. Missing fan or PSU entries count as faults; missing sensor indexes have their own alert. If a section heading disappears entirely (for example after an incompatible firmware update), preprocessing fails and the `nodata()` check warns of missing monitoring data instead of treating unexpected output as healthy.

A missing PSU watt reading is represented as `null`. The power measurement item may temporarily become unsupported, but **PSU failure status is reported independently**. Network, SSH and user privilege configurations can affect data availability. The CPU sampling window labels have not been verified against the vendor MIB. This template has not been tested with other S5850 models or FSOS releases.

## Security

- Create a **dedicated, least-privilege SSH account**. Restrict SSH access to the Zabbix server/proxy by management ACL or firewall. Do not use a general administrator account for monitoring.
- Use a **Secret text** macro or an approved external secret-management integration. A masked Zabbix macro is not equivalent to an independent secrets vault; review who can administer Zabbix hosts and items.
- The published XML contains **only macro references**, not device passwords, SNMP community strings, or infrastructure addresses.
- **Do not publish raw SNMP walks, configuration backups, or unredacted screenshots**, which can expose serial numbers, interface descriptions, filenames or your network layout.
- Do not import arbitrary templates without inspecting scripts and item commands. This repository's SSH command is only `show environment`.

## Development and validation

```sh
python3 tests/validate.py
node tests/test_parser.js
```

The included test fixture is **synthetic** and contains no real switch identifiers. These checks validate XML structure, parser behavior, known OIDs and the absence of obvious embedded credentials. They **do not replace** a test import into an actual Zabbix 7.4 instance or a live hardware test.

## Development and AI assistance

This project was developed with assistance from **OpenAI ChatGPT**, including analysis of SNMP OIDs, template design, JavaScript preprocessing, documentation, and regression tests. The original contributor configured and tested the monitoring setup on a physical FS S5850-24B4C running FSOS 7.5.5 with Zabbix 7.4.

The improved parser in this repository has been validated with synthetic tests but has **not yet been retested against the physical switch**. All AI-assisted contributions should be reviewed and tested in the target environment before production use. This is an independent community project, not an official product of or endorsed by FS.com, Zabbix, or OpenAI.

## License

Licensed under [MIT](LICENSE). Copyright (c) 2026 **cross media IT GmbH**. Contributions and reports from other FSOS versions are welcome; include the exact switch model and firmware, but redact network addresses, serial numbers and credentials.
