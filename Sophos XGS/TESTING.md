# Sophos XGS monitoring validation checklist

Based on the original contributor's [`TESTING.txt`](docs/original/TESTING.txt). Check off each relevant area on the actual firewall; successful import and synthetic validation are not substitutes for live SNMP and trigger checks.

- [ ] Record hardware model, **exact SFOS build**, Zabbix server/proxy version and standalone/HA configuration. Download the MIB from the firewall being tested.
- [ ] Import YAML into Zabbix 7.4, link **only** the Sophos XGS template to a test host initially. Configure SNMPv3 **AuthPriv** on the host and permit the actual polling server/proxy in Sophos Device access / Local-service ACL.
- [ ] Adjust `{$HA.EXPECTED}`, monitored licenses and any unused-port/backup-VPN/service context macros. Run interface and IPsec discovery once using **Execute now**; let the host poll for 15m.
- [ ] Review Latest data: model, firmware, serial, uptime, CPU, memory/disk/swap, services, HA and license status/expiry; investigate any **unsupported** item or discovery rule and record the exact error/OID.
- [ ] Compare discovered interface names and indices, admin/oper states, traffic and speed with SFOS GUI. Confirm 64-bit traffic counters and per-second error/discard rates. Administratively disabled ports must not raise link alarms.
- [ ] In an agreed maintenance window, interrupt **one noncritical, persistent** VPN. Verify its problem appears after about three bad 1m samples, remains open while disconnected and recovers when restored. An explicitly disabled/on-demand tunnel should not alarm. Check partial connectivity if safely possible.
- [ ] Only if safe, test one **noncritical** administratively enabled port going down and recovering. **Never unplug a critical uplink or HA cable** just to test a template.
- [ ] Standalone: HA disabled/state `2` should not mean faulty. HA pair: check peer/local health and set `{$HA.EXPECTED}=1`. Don't force an HA failover solely for monitoring validation.
- [ ] Cross-check license raw expiry strings and parsed timestamps; set `{$LICENSE.DATE.ORDER}` appropriately. Temporarily adjust a warning threshold to prove event and recovery, then restore it. Check `Dec 31 2999` maps to timestamp `32503679999` without format warnings; genuine expired license alarms should remain.
- [ ] Temporarily lower resource thresholds for a controlled alarm/recovery test, then return to intended values.
- [ ] Confirm `sophos.cpu.util` is numeric between 0 and 100 and plotted, rather than unsupported. Optional per-core discovery can be tested independently when needed.
- [ ] If safe, briefly restrict SNMP access and verify no-data behavior after about `{$SNMP.NODATA}=5m`. An unrelated open VPN/link alert must not self-resolve merely because measurements are stale.
- [ ] Compare `sysName`, `sysContact`, `sysLocation` and `ifType` against device values; check inventory mode and internal SNMP availability (`0`, `1`, `2`). Test hostname-change alert only when appropriate.
- [ ] Enable optional AP, VPN-policy, Wi-Fi client, CPU-core and SNMP trap functions individually only where supported. Traps require an operational receiver and matching numerical OIDs; fallback should not generate automatic problem events.
- [ ] Watch polling load, unsupported items and false alarms for **24–48 hours** before production alerting.

## Previously reported testing

The supplied `VALIDATION.json` documents **Zabbix 7.4.15 import, upgrade and export round-trip**, synthetic status regressions (VPN, interface, HA), native preprocessing/date tests, OID structural comparisons and disabled SNMPv3 AuthPriv test-host linking. It explicitly records **no direct device SNMP wire test** for those synthetic checks.

Separately, the contributor reports successful operation on **XGS 138 / SFOS 22.0.1 MR-1 build 490**, **XGS 2100 / SFOS 22.0 build 411** and **XGS 3300 / SFOS 22.0 build 411**. We do not infer that every optional function, HA failover, or fault-injection scenario was exercised.

For issue reports, provide the model, firmware build, Zabbix version, item key/OID, expected and observed behavior, and **redacted** logs. Never include SNMP passwords, internal IPs, serial numbers or configuration backups.
