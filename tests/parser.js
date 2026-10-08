// Tested on S5850-24B4C FSOS 7.5.5. Fail closed on missing sections.
// One SSH poll feeds all dependent Zabbix items.
var data = {fans: {}, power: {}, sensors: {}, summary: {}};
var seen = {fans: false, power: false, sensors: false};
var section = '';
var lines = value.replace(/\r/g, '').split('\n');

for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var m;
    if (/^\s*Fan Module:/i.test(line)) {
        section = 'fans'; seen.fans = true; continue;
    }
    if (/^\s*Power status:/i.test(line)) {
        section = 'power'; seen.power = true; continue;
    }
    if (/^\s*Sensor status/i.test(line)) {
        section = 'sensors'; seen.sensors = true; continue;
    }
    if (section === 'fans') {
        m = line.match(/^\s*(\d+)\s+(\d+-\d+)\s+(\S+)\s+(\d+(?:\.\d+)?%|-)\s+(\S+)/);
        if (m) {
            data.fans[m[2]] = {
                module: Number(m[1]), status: m[3],
                speed: m[4] === '-' ? null : parseFloat(m[4]), mode: m[5]
            };
        }
    } else if (section === 'power') {
        // A missing/faulty PSU may have '-' instead of numeric wattage.
        var parts = line.replace(/^\s+|\s+$/g, '').split(/\s+/);
        if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
            var watts = parts.length > 5 ? Number(parts[5]) : NaN;
            var rated = parts.length > 6 ? Number(parts[6]) : NaN;
            // Never return fake zeros when a watt reading is unavailable.
            data.power[parts[0]] = {
                present: parts[1], status: parts[2],
                type: parts[3] || '', alert: parts[4] || '',
                watts: (parts.length > 5 && /^\d+(?:\.\d+)?$/.test(parts[5])) ? watts : null,
                rated: (parts.length > 6 && /^\d+(?:\.\d+)?$/.test(parts[6])) ? rated : null
            };
        }
    } else if (section === 'sensors') {
        m = line.match(/^\s*(\d+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(\S+)/);
        if (m) {
            data.sensors[m[1]] = {
                value: Number(m[2]), lower: Number(m[3]),
                upper: Number(m[4]), critical: Number(m[5]), position: m[6]
            };
        }
    }
}
if (!seen.fans || !seen.power || !seen.sensors) {
    throw new Error('Missing section in show environment output');
}

// Fixed indexes are intentionally specific to S5850-24B4C.
var expectedFans = ['1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4'];
var fanErrors = 0;
var minSpeed = null;
for (var f = 0; f < expectedFans.length; f++) {
    var fan = data.fans[expectedFans[f]];
    if (!fan || fan.status.toUpperCase() !== 'OK') fanErrors++;
    if (fan && fan.speed !== null &&
        (minSpeed === null || fan.speed < minSpeed)) minSpeed = fan.speed;
}
var psuErrors = 0;
for (var p = 1; p <= 2; p++) {
    var psu = data.power[String(p)];
    if (!psu || psu.present.toUpperCase() !== 'PRESENT' ||
        psu.status.toUpperCase() !== 'OK' ||
        psu.alert.toUpperCase() !== 'NO') psuErrors++;
}
var sensorErrors = 0;
for (var s = 1; s <= 2; s++) {
    if (!data.sensors[String(s)]) sensorErrors++;
}
data.summary = {
    fan_errors: fanErrors, psu_errors: psuErrors,
    sensor_errors: sensorErrors, fan_min_speed: minSpeed
};
return JSON.stringify(data);
