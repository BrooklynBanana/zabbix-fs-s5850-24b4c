# Zabbix monitoring templates

Community-maintained Zabbix templates for network and IT infrastructure. Each device-specific directory contains its own template, installation instructions, compatibility notes, and (where applicable) tests and license.

## Available templates

| Device | Tested with | Monitoring | Project |
| --- | --- | --- | --- |
| **FS S5850-24B4C** | Zabbix 7.4; FSOS 7.5.5 | SNMP CPU, memory, firmware; SSH fan, PSU and temperature health | [Documentation and files](FS%20S5850-24B4C/README.md) |

## Notes

- Compatibility is confirmed only for the combinations stated in each template's README.
- Review templates and configure secrets on the monitored host before importing them into production.
- Raw SNMP walks and configuration backups are intentionally **not** included.
- This is an independent community project. AI assistance and testing limitations are disclosed in individual template documentation.

For bugs and improvements, open an [issue](https://github.com/BrooklynBanana/zabbix-templates/issues) with the device model, firmware, Zabbix version and a sanitized description of the problem.
