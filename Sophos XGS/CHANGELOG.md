# Changelog

Translation and consolidation of the original German `CHANGELOG.txt`, retained under [`docs/original/CHANGELOG.txt`](docs/original/CHANGELOG.txt). No monitoring logic was changed for publication.

## 1.0.4 — 2026-10-09

- Added SNMP system contact, location and `sysName` with inventory links, plus an informational hostname-change trigger.
- Added Zabbix's internal SNMP availability value: `0` unavailable, `1` available, `2` unknown; no redundant outage trigger.
- Added hourly `ifType` to discovered interfaces with common type value mappings.
- Added disabled-by-default `snmptrap.fallback` for unmatched trap messages; no automatic severity or alarm.
- Expanded documentation covering inventory, availability semantics, traps and optional ICMP monitoring.
- Final template: **92 fixed items, 27 item prototypes, 6 discoveries, 45 macros**. Existing UUIDs and item identifiers kept stable; upgrade/import round-trip and disabled SNMPv3 AuthPriv host linking tested in Zabbix 7.4.15.

## 1.0.3 — 2026-10-09

- Added actively polled average CPU utilization via `hrProcessorLoad`, using the same numerical OID and JSONPath averaging approach as Zabbix's HOST-RESOURCES-MIB CPU module.
- Included percentage plausibility checks, a 0–100% graph, persistent-load trigger (at least five high samples in 5m) and CPU no-data trigger.
- Added `{$CPU.MONITOR}` and `{$CPU.UTIL.HYST}`; optional per-core discovery remains disabled by default. Existing UUIDs and other trigger logic preserved.
- Tested native preprocessing and trigger behavior synthetically in Zabbix 7.4.15; specific on-device OID support still requires testing.

## 1.0.2 — 2026-10-09

- Improved license alarm names to show the product and observed state (`expired`, `deactivated`, `none`, `not subscribed`) instead of the ambiguous *license unavailable*.
- Retained license trigger semantics, OIDs, UUIDs, keys, macros and priority; existing open problem titles are not retroactively changed.
- Verified new event names and reimport/update behavior with simulated license values in Zabbix 7.4.15.

## 1.0.1 — 2026-10-09

- Fixed the license date parser to accept the reported Base license expiry `Dec 31 2999` as a valid date rather than an invalid format.
- Accepts valid four-digit years from 2000 through 9999 while continuing calendar validation and retaining the license status.
- Reproduced the initial format-warning issue and confirmed that the patch clears the format alarm but does **not** suppress genuine expired Email and Webserver Protection warnings.
- Tested 15 native parser/date scenarios, imports and upgrade behavior; UUIDs/keys/macros/triggers/OIDs unchanged.

## 1.0.0 — 2026-10-09

- Introduced a standalone Zabbix 7.4 template using numeric OIDs, stable UUIDv4 and no required linked base template.
- Combined Pinet inventory, resources, 21 services, HA, nine license products, interface monitoring and optional Wi-Fi/VPN-policy checks with community IPsec activation and partial-connectivity logic.
- Added debounced VPN/interface alarms, proper admin-state checks, explicit recovery conditions, optional-service controls and clear HA state mapping.
- Corrected Counter64 interface traffic, per-second error/discard rates, threshold/hysteresis macros, SNMP no-data handling and dependencies.
- Preserved raw license strings, added explicit date parsing and 30/7-day expiry warnings.
- Disabled optional WLAN, policy, individual CPU and trap checks by default; verified import/update, synthetic state tests and SNMPv3 test-host linking, but not full real-device fault behavior.
