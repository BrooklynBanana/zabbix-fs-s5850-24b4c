# Changelog

## [0.1.0] - 2026-10-08

Initial community release candidate for Zabbix 7.4 and FS S5850-24B4C (FSOS 7.5.5).

- SNMP: three CPU readings, used RAM percentage, firmware version.
- One read-only SSH `show environment` item with dependent fan, PSU and temperature metrics.
- Trigger coverage for missing/unhealthy fans and PSUs, missing sensors, high/critical temperatures and missing monitoring data.
- Safer CLI parsing: missing fans and PSUs count as errors; missing wattage isn't converted to a fake zero.
- Display units for temperature, fan speed and PSU consumption.
- Configurable temperature threshold macros.
- Security and AI-assistance documentation, XML and JavaScript tests, and CI workflow.

**Caveat:** Live testing was performed with the original parser. The improved parser has synthetic regression tests, but still needs a fresh live import/test.
