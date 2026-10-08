'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, 'parser.js'), 'utf8');
const parse = new Function('value', script);
const raw = fs.readFileSync(path.join(__dirname, 'environment_sample.txt'), 'utf8');
function check(msg, fn) { fn(); console.log('PASS', msg); }

check('healthy hardware', () => {
  const d = JSON.parse(parse(raw));
  assert.equal(d.summary.fan_errors, 0);
  assert.equal(d.summary.psu_errors, 0);
  assert.equal(d.summary.sensor_errors, 0);
  assert.equal(d.summary.fan_min_speed, 40);
  assert.equal(d.sensors['1'].value, 35);
  assert.equal(d.sensors['2'].value, 39);
  assert.equal(d.power['1'].watts, 39.25);
});
check('missing fan raises fan error without rejecting all metrics', () => {
  const d = JSON.parse(parse(raw.replace(/^4\s+2-4\s+.*\n/m, '')));
  assert.equal(d.summary.fan_errors, 1);
  assert.equal(d.summary.psu_errors, 0);
});
check('non-OK fan raises fan error', () => {
  const d = JSON.parse(parse(raw.replace('1-3     OK', '1-3     FAIL')));
  assert.equal(d.summary.fan_errors, 1);
});
check('missing PSU raises PSU error', () => {
  const d = JSON.parse(parse(raw.replace(/^2\s+PRESENT\s+OK\s+AC\s+NO\s+.*\n/m, '')));
  assert.equal(d.summary.psu_errors, 1);
  assert.equal(d.summary.sensor_errors, 0);
});
check('PSU alert and absent wattage produce error and null wattage', () => {
  const txt = raw.replace(/^2\s+PRESENT\s+OK\s+AC\s+NO\s+.*\n/m, '2 ABSENT FAIL AC YES - -\n');
  const d = JSON.parse(parse(txt));
  assert.equal(d.summary.psu_errors, 1);
  assert.equal(d.power['2'].watts, null);
});
check('missing temperature sensor raises sensor health alarm', () => {
  const d = JSON.parse(parse(raw.replace(/^2\s+39\s+-10\s+100\s+110\s+SWITCH_CHIP\n/m, '')));
  assert.equal(d.summary.sensor_errors, 1);
  assert.equal(d.summary.psu_errors, 0);
});
check('wrong CLI output fails rather than reporting healthy', () => {
  assert.throws(() => parse('permission denied'), /Missing section/);
});

// Parser also tested as the exact JavaScript embedded in the exported XML.
