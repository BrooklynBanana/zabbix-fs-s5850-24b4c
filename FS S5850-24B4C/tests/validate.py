#!/usr/bin/env python3
"""Static checks for Zabbix 7.4 XML and accidental publishing of secrets."""
import pathlib
import re
import uuid
import xml.etree.ElementTree as ET

base = pathlib.Path(__file__).resolve().parents[1]
path = base / 'template_fs_s5850_24b4c_zabbix_7.4.xml'
text = path.read_text(encoding='utf-8')
root = ET.fromstring(text)
assert root.tag == 'zabbix_export'
assert root.findtext('version') == '7.4'
tmpl = root.find('./templates/template')
assert tmpl is not None
assert tmpl.findtext('template') == 'FS S5850-24B4C'
items = tmpl.findall('./items/item')
keys = [item.findtext('key') for item in items]
assert len(items) == 14, len(items)
assert len(set(keys)) == len(keys)
assert len(root.findall('.//trigger')) == 11
threshold_macros = {m.findtext('macro'): m.findtext('value') for m in tmpl.findall('./macros/macro')}
assert threshold_macros == {
    '{$FS.TEMP.AROUND.HIGH}': '65', '{$FS.TEMP.AROUND.CRIT}': '80',
    '{$FS.TEMP.SWITCH.HIGH}': '100', '{$FS.TEMP.SWITCH.CRIT}': '110'
}
expressions = '\n'.join(x.findtext('expression') or '' for x in root.findall('.//trigger'))
assert all(m in expressions for m in threshold_macros)
expected_oids = {
 'fsCPUUtilization5Sec': '1.3.6.1.4.1.52642.1.1.9.1.0',
 'fsCPUUtilization1Min': '1.3.6.1.4.1.52642.1.1.9.2.0',
 'fsCPUUtilization5Min': '1.3.6.1.4.1.52642.1.1.9.3.0',
 'fsMemoryPoolCurrentUtilization': '1.3.6.1.4.1.52642.1.1.1.13.1.5.0',
 'fsSystemSwVersion': '1.3.6.1.4.1.52642.1.1.3.5.0',
}
item_by_key = {item.findtext('key'): item for item in items}
for key, oid in expected_oids.items():
 assert item_by_key[key].findtext('snmp_oid') == oid, key
for key, unit in {
 'fs.env.fans.min_speed': '%', 'fs.env.psu.watts[1]': 'W',
 'fs.env.psu.watts[2]': 'W', 'fs.env.temp[1]': '°C',
 'fs.env.temp[2]': '°C'
}.items():
 assert item_by_key[key].findtext('units') == unit, key
for el in root.findall('.//uuid'):
 assert len(el.text) == 32
 uuid.UUID(hex=el.text)
for dep in (x for x in items if x.findtext('type') == 'DEPENDENT'):
 assert dep.findtext('./master_item/key') in keys
assert 'show environment' == item_by_key['ssh.run[fs_environment,{$FS.SSH.IP},22]'].findtext('params')
assert item_by_key['ssh.run[fs_environment,{$FS.SSH.IP},22]'].findtext('password') == '{$FS.SSH.PASSWORD}'
assert item_by_key['ssh.run[fs_environment,{$FS.SSH.IP},22]'].findtext('./preprocessing/step/parameters/parameter') == (base / 'tests/parser.js').read_text(encoding='utf-8').rstrip('\n')
# Reject likely internal hostnames, serials, config backup references and IPv4 literals.
# OIDs are deliberately excluded from the IPv4-literal check.
assert not re.search(r'\bSW-[A-Z0-9-]{4,}\b', text)
assert not re.search(r'\bCG\d{10,}\b', text)
assert 'startup-config.conf' not in text
for element in root.iter():
    if element.tag == 'snmp_oid':
        continue
    if element.text:
        assert not re.search(r'(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)', element.text), element.tag
print(f'PASS XML parsed: Zabbix 7.4; {len(items)} items; {len(root.findall(".//trigger"))} triggers')
print('PASS known OIDs, units, dependent references, UUIDs, basic secrets check')
