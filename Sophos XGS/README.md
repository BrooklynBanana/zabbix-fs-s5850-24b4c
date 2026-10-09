# Sophos XGS by SNMP for Zabbix 7.4

Community-maintained, standalone **Sophos XG/XGS firewall monitoring template** for Zabbix 7.4. It combines and adapts the [Pinet Sophos XG template](https://github.com/pinetteam/sophos-xg-firewall-template) and the [Zabbix community Sophos XG IPsec template](https://github.com/zabbix/community-templates/tree/main/Network_Devices/template_sophos_xg_ipsec_vpn_version_21.0.x/7.0). All SNMP OIDs are numeric; no local MIB installation or supplementary SNMP template is required for importing it.

> **Version:** 1.0.4  
> **Zabbix:** Export and import format 7.4; import/update tested with **7.4.15**.  
> **Field-tested by the contributor:** **XGS 138 (SFOS 22.0.1 MR-1, build 490)**, **XGS 2100** and **XGS 3300 (both SFOS 22.0.0, build 411)**. Successful use was reported on all three. This does **not** establish that every OID, optional discovery rule, HA path, failover condition or alarm/recovery scenario was individually tested.  
> **Status:** Community-tested; review macros, permissions and alert behavior before production rollout. Independent project, not endorsed by Sophos or Zabbix.

## Contents

- [`sophos_xgs_snmp_7.4.yaml`](sophos_xgs_snmp_7.4.yaml): importable template, preserved **unchanged** from the contributor's tested v1.0.4 package.
- [`CHANGELOG.md`](CHANGELOG.md): English version history.
- [`TESTING.md`](TESTING.md): installation and regression checklist.
- [`tests/validate.py`](tests/validate.py): static template consistency checks (not a device test).
- [`docs/original/`](docs/original/): the original German documentation, validation results and source-package manifest for transparency. The manifest checksums describe the **original ZIP filenames and bytes**, not this reorganized repository.
- [`LICENSE-PINET.txt`](LICENSE-PINET.txt), [`LICENSE-COMMUNITY.txt`](LICENSE-COMMUNITY.txt): required upstream MIT notices. See **Attribution and licensing** below.

## Monitoring coverage

| Category | Metrics / alarms |
|---|---|
| Firewall identity | Model, serial number, firmware, name, system contact/location, uptime, SNMP engine ID, internal interface availability |
| Resources | Mean CPU utilization, memory, disk, swap, resource thresholds and hysteresis |
| Interfaces | Discovery, administrative/operational status, type, speed, 64-bit traffic counters, error and discard rates, utilization and sustained link-down alerts |
| IPsec VPN | Tunnel discovery, enabled/disabled and connection states, including separately reported partial connectivity |
| High availability | HA state, local and peer health, configurable expectation for an HA pair |
| Security and services | Service status monitoring, selected firewall security/version information, user and HTTP/FTP/mail activity rates |
| Licenses | Nine license categories: status, raw expiry value, parsed timestamp and configurable 30/7-day warnings |
| Optional | VPN policies, Wi-Fi access points and clients, individual CPU cores, SNMP trap logs / unmatched trap fallback |

The v1.0.4 YAML defines **92 fixed items, 27 item prototypes, 6 discovery rules and 45 macros**. Four optional discovery rules (VPN policies, APs, Wi-Fi clients, per-core CPU) are disabled by default, as are optional trap items. Actual host item counts depend on discovered rows.

## Quick start

1. **Enable SNMP on Sophos:** in SFOS 22, open **Administration → SNMP**, enable the agent and download the MIB from the device for firmware-specific diagnostics. Create a dedicated **SNMPv3** monitoring user and enable **Accept queries**. Configure authentication and privacy algorithms/passwords supported by both SFOS and the Zabbix server/proxy. On SFOS, use **Device access** or a suitable **Local service ACL** to permit queries from the *actual polling server/proxy*; limit access to that source.
2. **Note:** the SNMPv3 user's **Authorized hosts** setting is for **trap destinations**, not a query-source ACL. Receiving traps is optional and not required for ordinary polling.
3. In **Data collection → Templates → Import**, select [`sophos_xgs_snmp_7.4.yaml`](sophos_xgs_snmp_7.4.yaml). Create the template and inspect the preview. The template name is **Sophos XGS by SNMP** in **Templates/Network devices**.
4. Create a test firewall host under **Data collection → Hosts**, assign an **SNMP interface** with the management IP (typically UDP 161), set **SNMPv3**, **AuthPriv**, security name, matching auth/privacy protocols and both passphrases. Specify an SNMP context only when your firewall uses one. Configure the **host's** interface and credentials; the YAML does not include secrets or force SNMPv2c.
5. Link **Sophos XGS by SNMP**. It is standalone. Do not automatically link generic SNMP/interface templates that duplicate keys or measurements. Optional official **ICMP Ping** monitoring can be linked separately.
6. Adjust the host macros below **before enabling notifications**, then run **Network interfaces discovery** and **IPSec VPN tunnels discovery** using *Execute now*. Collect data for about 15 minutes and review **Monitoring → Latest data**, unsupported items and current problems.
7. Follow [`TESTING.md`](TESTING.md). Evaluate item support and alert noise over 24–48 hours. Do not interrupt critical production uplinks, VPNs or HA solely to test alarms.

### Host macro essentials

| Macro / example | Default | Meaning |
|---|---|---|
| `{$HA.EXPECTED}` | `0` | Standalone is acceptable. Set `1` when a healthy HA pair must be present. |
| `{$VPN.MONITOR}` | `1` | Alarm on enabled, persistently expected VPNs. Set a specific backup/on-demand tunnel to `0`. |
| `{$IF.MONITOR}` | `1` | Enable link/interface alerts, or exclude unused ports at host level. Statistics continue to be collected. |
| `{$IF.NAME.MATCHES}` / `{$IF.NAME.NOT_MATCHES}` | `.*` / `^lo$` | Discovery include/exclude filters. Excluding discovered interfaces is different from disabling their alerts. |
| `{$SERVICE.MONITOR}` | `1` | Service alert control using service suffixes. Certain optional services have explicit `0` defaults. |
| `{$LICENSE.MONITOR}` | `1` | License alarms, including expiry and parser-format checks. |
| `{$LICENSE.EXPECTED}` | `0` | Optional unlicensed products are acceptable. Set `1` for license categories that must be subscribed. |
| `{$CPU.MONITOR}` | `1` | CPU alarms enabled; setting `0` retains polling. |
| `{$SNMP.NODATA}` | `5m` | Freshness threshold for missing uptime/SNMP data. |

**Concrete exceptions** (add on the *host*, replacing names with actual discovered values):

```text
{$HA.EXPECTED}                         = 1
{$VPN.MONITOR:"Backup-VPN"}           = 0
{$IF.MONITOR:"Port8"}                 = 0
{$SERVICE.MONITOR:"sslvpn"}           = 1
{$LICENSE.EXPECTED:"network"}         = 1
```

Zabbix **macro context** values are case-sensitive. VPN contexts use discovered tunnel names; interface contexts use **ifName** (not a description/alias); services and license contexts use the **item-key suffix**.

For several access ports, use a single regex context:

```text
{$IF.MONITOR:regex:"^Port(4|5|6|F1|F2)$"} = 0
```

This suppresses link alarms for precisely Port4, Port5, Port6, PortF1 and PortF2, while retaining their metrics. An exact macro such as `{$IF.MONITOR:"Port4"}=1` takes precedence and restores alerts for that port. Do not create overlapping, contradictory regex contexts. The same `:regex:` pattern works for VPN, service and license monitoring where context is supported; exact contexts also take precedence over inherited regex defaults. For services that are **already excluded** by exact template macros, override the exact context to `1` to opt in.

**Optional services initially excluded:** `pop3`, `imap4`, `smtp`, `ftp`, `as`, `ntp`, `sslvpn`, `drouting`, `ssh`. `untouched` (0) and `unregistered` (7) service states are not treated as operational failures. Enable a service explicitly when it must run.

### CPU, resource and interface thresholds

The enabled `sophos.cpu.util` item uses the mean of returned `hrProcessorLoad` rows. It polls every minute; five high observations within a five-minute window are required for a sustained-load alarm. The per-core discovery is optional and disabled initially.

| Setting | Default | Notes |
|---|---:|---|
| `{$CPU.UTIL.WARN}` / `{$CPU.UTIL.HYST}` | 90 / 5 | Percent and recovery percentage points |
| `{$DISK.UTIL.WARN}` / `{$DISK.UTIL.CRIT}` / `{$DISK.UTIL.HYST}` | 85 / 95 / 5 | Percent / percent / points |
| `{$MEMORY.UTIL.WARN}` / `{$MEMORY.UTIL.CRIT}` / `{$MEMORY.UTIL.HYST}` | 85 / 95 / 5 | Percent / percent / points |
| `{$SWAP.UTIL.WARN}` / `{$SWAP.UTIL.CRIT}` / `{$SWAP.UTIL.HYST}` | 50 / 80 / 5 | Percent / percent / points |
| `{$IF.UTIL.WARN}` / `{$IF.UTIL.HYST}` | 90 / 5 | Percent of port speed over 15m; hysteresis points |
| `{$IF.ERRORS.WARN}` / `{$IF.DISCARDS.WARN}` | 1 / 1 | **Errors/discards per second**, averaged over 5 minutes, per direction; not one error in five minutes |

High/critical thresholds should be sensibly ordered. Interface error/discard alerting includes recovery hysteresis. Context-specific macro values can be assigned to individual ifName interfaces.

### VPN, port and HA alert semantics

- **VPN:** an administratively enabled and selected tunnel that remains down or partly connected triggers after sufficiently many bad samples. It does **not** require an observed up-to-down transition. Backup/on-demand VPNs can be excluded with `{$VPN.MONITOR:"exact-tunnel-name"}=0`.
- **Interfaces:** sustained link-down requires the interface to be administratively up. Administratively disabled ports do not generate link-down problems. Interface errors/discards remain measurable even if link alerts are muted.
- **Debounce:** `{$VPN.FAIL.WINDOW}=3m`, `{$VPN.FAIL.SAMPLES}=3`, `{$IF.FAIL.WINDOW}=3m`, `{$IF.FAIL.SAMPLES}=3`. With nominal 1m polling, detection typically takes approximately 2–3 minutes; skipped samples may extend this. Keep sampling windows compatible with minimum sample counts.
- **HA:** state `4` is faulty; state `2` represents standalone. Local and peer failures are monitored separately; normal primary/auxiliary/ready states are not considered faults. Set `{$HA.EXPECTED}=1` on firewalls expected to remain an HA pair.
- **Stale data:** the SNMP no-data alarm suppresses certain downstream alerts via dependencies. Existing VPN/port problems require fresh, appropriate status values to recover; missing data must not be interpreted as recovery.

### Licenses and expiry dates

The nine license contexts are `base`, `network`, `web`, `email`, `webserver`, `zeroday`, `enhanced.support`, `enhanced.plus`, and `central.orchestration`.

- `{$LICENSE.MONITOR}=1`: monitor configured products, including status and expiry warnings. Set a category context to `0` to mute its license alarms while retaining values, e.g. `{$LICENSE.MONITOR:"email"}=0`.
- `{$LICENSE.EXPECTED}=0`: *none/not subscribed* is acceptable. Set category-specific `1` for products that must be licensed, e.g. `{$LICENSE.EXPECTED:"network"}=1`.
- `{$LICENSE.WARN.DAYS}=30`, `{$LICENSE.CRIT.DAYS}=7`: warning and critical windows. The critical days threshold must not exceed the warning days threshold.
- `{$LICENSE.DATE.ORDER}=YMD`: set explicitly to `DMY` or `MDY` if your device returns locale-dependent numeric dates. Never guess numeric date ordering.
- Supported raw forms include `2027-01-31`, `31 Jan 2027`, `Jan 31, 2027`, and numeric dates with the selected order. The parser intentionally supports a valid future date such as `Dec 31 2999` without treating it as perpetual by default.
- Parsed epoch `0` is reserved for empty/perpetual/N/A; `-1` indicates an unsupported date format and may raise an informational diagnosis. Date parsing uses **UTC end-of-day**, not a guaranteed contractual expiration second. Raw strings remain available for troubleshooting.
- *Expired* and *deactivated* statuses alert when monitored; *none/not subscribed* alerts only if expected. Newly created license problems display readable product names and reported states; existing problem event names do not change retroactively when updating the template.

### Polling and optional features

| Measurement | Typical cadence |
|---|---|
| Status and average CPU | 1m |
| Interface / IPsec discovery | 15m |
| Interface speed | 5m |
| License status and raw expiry | 1h |
| sysName, sysLocation, sysContact and ifType | 1h |
| Internal SNMP availability | 1m; `0` unavailable, `1` available, `2` unknown |
| Speed freshness `{$IF.SPEED.NODATA}` | 15m |
| License freshness `{$LICENSE.NODATA}` | 3h |

After import, optional **IPsec policies**, **Wi-Fi APs/clients**, and **CPU core discovery** can be enabled individually. AP checks use `{$AP.MONITOR}` and `{$AP.CLIENTS.WARN}=50`. Wi-Fi clients can generate many short-lived items. Optional **Sophos notifications** and `snmptrap.fallback` are initially disabled, require a separately configured trap receiver, and do not infer severity from trap text. Fallback logs traps not matched by other active trap items; ensure no other linked template already owns `snmptrap.fallback`.

To add ping loss and latency, separately link the official **ICMP Ping** template if appropriate. The supplied YAML does not require or automatically link it. If using Zabbix inventory, switch the host's **Inventory mode** to **Automatic** to accept mapped device details; the template does not alter this host setting.

## Upgrade guidance and known limitations

- Before updating, **export a backup** of your working template. Import the new YAML with *Create new* and *Update existing*. Do **not** enable *Delete missing* unless intentional. Existing UUIDs/keys were kept stable through versions 1.0.0–1.0.4.
- Recheck per-host overrides and items that were manually enabled when importing an updated version. Avoid duplicating existing `system.name`, CPU, interface or trap keys by linking another template.
- Some OIDs may be unsupported depending on model, firmware or SNMP view. Compare an unsupported numerical OID against the MIB downloaded from *that exact firewall*. The upstream MIB confirms structure, not universal device support.
- Per-interface / per-tunnel items use SNMP indexes. After reboot or firmware changes, verify index/name mappings; history attached to a recycled index may describe a different interface or tunnel. Lost LLD entries are disabled after **1h** and deleted after **7d**.
- A tunnel that disappears completely from the discovery table may need a separate **expected-inventory** check. Polling only existing discovery rows cannot prove that an expected row still exists.
- A missing PSU or other physical state may not be exposed by the chosen firmware's OIDs. SNMPv3 engine IDs and allowed views can change across device replacement/HA failover.
- The supplied validation results cover a Zabbix 7.4.15 import, round-trip, AuthPriv test-host linking, synthetic trigger-state and date-processing cases. They **do not claim a comprehensive live SNMP/HA fault-injection test**. The field-testing statement above is user-reported operational experience on three XGS appliances.

## Validation, troubleshooting and reporting issues

Run the local static audit (requires Python and PyYAML):

```sh
python3 -m pip install PyYAML
python3 tests/validate.py
```

Then use [`TESTING.md`](TESTING.md) on an actual device. For reports include firewall model, exact SFOS build, Zabbix/Proxy version, HA/standalone mode, failed item key/OID, the actual (redacted) SNMP error and relevant expected/observed alarm timings. Never attach unredacted SNMP dumps, SNMPv3 secrets, serial numbers or network topology screenshots.

## Attribution, licensing and AI assistance

This is a **community adaptation**, incorporating material derived from:

- [Pinet / Ali Erdem Sunar, Sophos XG firewall template](https://github.com/pinetteam/sophos-xg-firewall-template), source revision `21db4a3850995dc302662d6519490d4aeb132930`, MIT notice retained in [`LICENSE-PINET.txt`](LICENSE-PINET.txt).
- [Zabbix community Sophos XG IPsec template](https://github.com/zabbix/community-templates/tree/main/Network_Devices/template_sophos_xg_ipsec_vpn_version_21.0.x/7.0), source blob `9e5fd8be5065536acf168c7c05ae6227ab53a215`, MIT notice retained in [`LICENSE-COMMUNITY.txt`](LICENSE-COMMUNITY.txt).

Original rights and copyright notices remain with their respective authors. The distributed template is not official Sophos or Zabbix software. The supplied package did **not** include a Sophos MIB.

**AI disclosure:** This template and its original German documentation were developed with assistance from an office ChatGPT account, including template design, SNMP analysis, preprocessing and test planning. The GitHub English documentation and packaging were also AI-assisted. The contributor independently deployed and exercised the template on the XGS 138, 2100 and 3300 noted above. Human review and device-specific validation remain necessary, especially before acting on infrastructure alerts.
