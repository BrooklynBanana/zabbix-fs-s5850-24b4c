#!/usr/bin/env python3
"""Static integrity checks. Not a Zabbix import or hardware SNMP test."""
from pathlib import Path
import re
import uuid
import yaml

root = Path(__file__).resolve().parents[1]
text = (root / 'sophos_xgs_snmp_7.4.yaml').read_text(encoding='utf-8')
export = yaml.safe_load(text)['zabbix_export']
assert str(export['version']) == '7.4'
assert len(export['templates']) == 1
t = export['templates'][0]
assert t['template'] == 'Sophos XGS by SNMP'
assert len(t['items']) == 92
assert len(t['discovery_rules']) == 6
assert len(t['macros']) == 45
assert sum(len(d.get('item_prototypes', [])) for d in t['discovery_rules']) == 27
assert len({i['key'] for i in t['items']}) == 92
assert len({m['macro'] for m in t['macros']}) == 45
assert sum(d.get('status') == 'DISABLED' for d in t['discovery_rules']) == 4
assert all(uuid.UUID(hex=v['uuid']) for v in [t] + t['items'] + t['discovery_rules'])
assert not re.search(r'(?i)(?:password|passphrase|community|api[_-]?key)\s*:\s*[^\s#{}]+', text)
# Exclude numeric SNMP OIDs, whose dotted components can resemble IPs.
assert not re.search(r'(?<![\d.])(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\.\d{1,3}(?![\d.])', text)
print('PASS: Zabbix 7.4, 92 items, 27 prototypes, 6 LLD rules, 45 macros')
print('PASS: keys, UUIDs, optional LLD statuses, basic secret/IP checks')
print('NOTE: No Zabbix import or SNMP network test performed')
