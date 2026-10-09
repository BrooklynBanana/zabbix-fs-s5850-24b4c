# Zabbix monitoring templates

Community-maintained Zabbix templates for network and IT infrastructure. Each device-specific directory contains its own importable template, installation instructions, compatibility notes and test documentation.

## Available templates

| Device | Tested with | Monitoring | Project |
| --- | --- | --- | --- |
| **FS S5850-24B4C** | Zabbix 7.4; FSOS 7.5.5 | SNMP CPU, memory, firmware; SSH fan, PSU and temperature health | [Documentation and files](FS%20S5850-24B4C/README.md) |
| **Sophos XGS 138, 2100, 3300** | Zabbix 7.4; SFOS 22.0 / 22.0.1 MR-1 | Standalone SNMPv3 monitoring: CPU/resources, interfaces, IPsec VPN, HA, services and licenses | [Documentation and files](Sophos%20XGS/README.md) |

## Notes

- Compatibility is documented per template; not all features or firmware combinations have been fully tested.
- Review templates, their licensing and their preconfigured triggers before importing into production.
- Configure credentials on the monitored host; never publish credentials or unredacted SNMP walks.
- These are independent community projects. AI assistance and testing limitations are disclosed in each template's README.

For bugs or suggestions, [open an issue](https://github.com/BrooklynBanana/zabbix-templates/issues) including the model, firmware, Zabbix version and sanitized diagnostics.

## License and copyright

The company's contributions are licensed under the [MIT License](LICENSE), Copyright (c) 2026 **cross media IT GmbH**. Each template also has its own license information. The [FS S5850-24B4C](FS%20S5850-24B4C/LICENSE) template includes a matching MIT notice, and the [Sophos XGS](Sophos%20XGS/README.md#attribution-licensing-and-ai-assistance) template incorporates third-party MIT-licensed material whose original copyright notices remain in its folder. Those upstream notices are **not** replaced by the company license.
