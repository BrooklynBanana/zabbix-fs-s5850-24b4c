# Sophos XGS by SNMP für Zabbix 7.4

**Template-Version:** 1.0.4 · **Stand:** 09.10.2026

Diese eigenständige Vorlage kombiniert die Basisüberwachung von Pinet mit dem IPsec-Ansatz des Zabbix-Community-Templates. Sie verwendet numerische OIDs und unterstützt SNMPv3 über das SNMP-Interface des Zabbix-Hosts.

Der Import wurde in **Zabbix 7.4.15** erfolgreich geprüft. Das Template ist ein produktionsorientierter Testkandidat: Die verfügbaren OIDs und Zustandswerte müssen noch auf deiner konkreten XGS und SFOS-Version bestätigt werden.

## 1. Dateien und Voraussetzungen

| Datei | Zweck |
|---|---|
| [sophos_xgs_snmp_7.4.yaml](sophos_xgs_snmp_7.4.yaml) | Importierbares Template |
| [CHANGELOG.txt](CHANGELOG.txt) | Änderungen gegenüber den Ursprungsvorlagen |
| [TESTING.txt](TESTING.txt) | Checkliste für den Firewall-Test |
| [VALIDATION.json](VALIDATION.json) | Ergebnisse der bereits durchgeführten Prüfungen |
| [MANIFEST.json](MANIFEST.json) | Quellenrevisionen und SHA-256-Prüfsummen |
| LICENSE-PINET.txt / LICENSE-COMMUNITY.txt | Lizenzhinweise der Ursprungsvorlagen |

Voraussetzungen:

- Zabbix 7.4; geprüfter Importstand: 7.4.15.
- Sophos XG/XGS mit SNMP-Unterstützung. Die IPsec-Tabelle ist für SFOS 20 oder neuer vorgesehen; ihre tatsächliche Verfügbarkeit hängt von der Firmware ab.
- Erreichbarkeit der Firewall vom **tatsächlich abfragenden Zabbix-Server oder Proxy** über den konfigurierten SNMP-Port, normalerweise UDP 161.
- SNMPv3-Benutzer mit erlaubten Abfragen und passenden Authentifizierungs-/Verschlüsselungseinstellungen.

Für die numerischen OIDs ist keine lokale Sophos-MIB zur Namensauflösung erforderlich. Lade die MIB trotzdem direkt von deiner Firewall herunter: Sie dient zum Abgleich mit deiner Firmware.

## 2. SNMP auf der Sophos vorbereiten

Die folgende Menübezeichnung folgt der Sophos-Dokumentation für SFOS 22. Bei älteren Versionen kann die Oberfläche abweichen.

1. Öffne **Administration > SNMP** und aktiviere den SNMP-Agenten.
2. Lade über **Download MIB** die MIB dieser Firewall herunter.
3. Lege einen eigenen SNMPv3-Benutzer für die Überwachung an.
4. Aktiviere beim Benutzer **Accept queries**.
5. Wähle Authentifizierung und Verschlüsselung. SFOS 22 dokumentiert unter anderem **SHA256/SHA512** und **AES**. Verwende die von deiner Firmware angebotenen und vom Zabbix-Server/Proxy unterstützten Optionen.
6. Hinterlege getrennte Authentifizierungs- und Verschlüsselungspasswörter.
7. Erlaube den SNMP-Zugriff unter **Device access** beziehungsweise über eine passende **Local-Service-ACL**, beschränkt auf den Zabbix-Server/Proxy.

**„Authorized hosts“ beim SNMPv3-Benutzer bezeichnet Trap-Empfänger. Dieses Feld beschränkt die Quellen von SNMP-Abfragen nicht.** Die Zugriffsbeschränkung erfolgt über Device Access beziehungsweise die Local-Service-ACL.

Für die normale Überwachung sind Traps nicht erforderlich. Die Zugangsdaten werden nicht in der Template-YAML gespeichert.

## 3. Template importieren

1. Öffne in Zabbix **Datensammlung > Templates > Import**; in der englischen Oberfläche **Data collection > Templates > Import**.
2. Wähle `sophos_xgs_snmp_7.4.yaml`.
3. Lasse die enthaltenen Objekte beim ersten Import erstellen und prüfe die Importvorschau.
4. Bestätige den Import.
5. Kontrolliere, dass **Sophos XGS by SNMP** in der Gruppe **Templates/Network devices** vorhanden ist.

Das Template benötigt keine verknüpften Basis- oder Interface-Templates. Es hat eigene UUIDs und ersetzt die beiden Ursprungsvorlagen nicht automatisch.

Falls bereits Sophos- oder Generic-SNMP-Templates am Host hängen, prüfe deren Items und Alarme auf doppelte Überwachung. Beginne möglichst mit einem separaten Test-Host.

## 4. Zabbix-Host mit SNMPv3 einrichten

1. Erstelle unter **Datensammlung > Hosts** einen Host für die Firewall.
2. Wähle eine passende Hostgruppe und gegebenenfalls den zuständigen Proxy.
3. Verknüpfe das Template **Sophos XGS by SNMP**.
4. Füge ein **SNMP-Interface** mit der erreichbaren Management-IP und dem SNMP-Port hinzu.
5. Stelle die folgenden Werte ein:

| Einstellung | Wert |
|---|---|
| SNMP-Version | SNMPv3 |
| Security name | Benutzername auf der Sophos |
| Security level | AuthPriv |
| Authentication protocol | Passend zur Sophos-Konfiguration |
| Authentication passphrase | Authentifizierungspasswort |
| Privacy protocol | Passend zur Sophos-Konfiguration, beispielsweise AES |
| Privacy passphrase | Verschlüsselungspasswort |
| Context name | Der von deinem Agenten verwendete Kontext; keinen Wert erfinden |

Speichere den Host und aktiviere ihn. Version, Benutzer und Algorithmen werden am Host konfiguriert; das Template erzwingt weder SNMPv2c noch eine Community.

## 5. Host-Makros an die Umgebung anpassen

Öffne am Host den Bereich **Makros**. Überschreibe nur die Einstellungen, die für diesen Host abweichen. Die Vorlage enthält Standardwerte und Beschreibungen für alle Makros.

### HA, Tunnel und Ports

| Makro | Standard | Anwendung |
|---|---:|---|
| `{$HA.EXPECTED}` | `0` | Standalone erlaubt. Für ein erwartetes HA-Paar auf `1` setzen. |
| `{$VPN.MONITOR}` | `1` | Aktivierte VPN-Verbindungen sollen verbunden bleiben. Kontextbezogen für Backup-/On-Demand-Tunnel auf `0` setzen. |
| `{$IF.MONITOR}` | `1` | Interface-Alarme aktiv. Kontextbezogen für unbenutzte Ports auf `0` setzen. |
| `{$IF.NAME.MATCHES}` | `.*` | Einschlussfilter der Interface-Discovery. |
| `{$IF.NAME.NOT_MATCHES}` | `^lo$` | Ausschlussfilter der Interface-Discovery. |

Beispiele für **Host-Makros**:

```text
Makro                                  Wert
{$HA.EXPECTED}                          1
{$VPN.MONITOR:"Backup-VPN"}             0
{$IF.MONITOR:"Port8"}                   0
{$SERVICE.MONITOR:"sslvpn"}             1
{$LICENSE.EXPECTED:"network"}           1
```

Ersetze `Backup-VPN` und `Port8` durch die exakt erkannten Namen. Der Interface-Kontext verwendet **ifName**, nicht den Alias. Kontextwerte für Dienste und Lizenzen entsprechen dem Suffix des Item-Keys.

`MONITOR=0` schaltet die zugehörigen Alarme aus; die Messwerte werden weiterhin gesammelt. Ein Discovery-Filter entfernt dagegen Zeilen aus der Discovery und kann deren erzeugte Items später deaktivieren oder löschen.

### Ports einzeln oder mit Regex auswählen

Unter **Host > Makros** kannst du entweder einen exakten Portnamen oder einen Regex-Kontext verwenden. Beide Varianten funktionieren mit dem vorhandenen Template; ein erneuter YAML-Import ist nicht erforderlich.

**Einzelner Port:**

```text
Makro: {$IF.MONITOR:"Port4"}
Wert:  0
```

**Mehrere Ports mit einem Makro:**

```text
Makro: {$IF.MONITOR:regex:"^Port(4|5|6|F1|F2)$"}
Wert:  0
```

Dieser Ausdruck trifft genau `Port4`, `Port5`, `Port6`, `PortF1` und `PortF2`. `^` und `$` begrenzen die Übereinstimmung auf den vollständigen Namen, sodass beispielsweise `Port40` nicht mit erfasst wird. Alternativ lassen sich die Zahlenbereiche kompakt schreiben:

```text
{$IF.MONITOR:regex:"^Port([4-6]|F[12])$"}
```

Verwende nur eine der beiden gleichwertigen Regex-Varianten. Nach dem Anlegen des Regex-Makros kannst du die entsprechenden Einzelmakros entfernen. Die Messwerte aller Ports bleiben erhalten; nur die zugehörigen Interface-Alarme sind bei Wert `0` ausgeschaltet. Nicht passende Ports verwenden weiterhin den Standard `{$IF.MONITOR}=1`.

**Gezielte Ausnahme:** Ein exakter Kontext hat Vorrang vor einem Regex-Kontext. Wenn beispielsweise `Port4` wieder überwacht werden soll, kannst du ihn aus dem Regex entfernen oder zusätzlich `{$IF.MONITOR:"Port4"}=1` setzen. Vermeide mehrere überlappende Regex-Kontexte mit unterschiedlichen Werten, da deren Auswertungsreihenfolge nicht festgelegt ist. Die Namen müssen dem erkannten **ifName** einschließlich Groß-/Kleinschreibung entsprechen.

Die Syntax `regex:` gehört in die **Host-Makrodefinition**. Die Trigger-Prototypen verwenden weiterhin ihren vorhandenen Kontext mit `{#IFNAME}`. Details: [Zabbix 7.4 – Makros mit Kontext](https://www.zabbix.com/documentation/7.4/en/manual/config/macros/user_macros_context).

### Dienste

`{$SERVICE.MONITOR}` ist standardmäßig `1`. Für die optionalen Dienste `pop3`, `imap4`, `smtp`, `ftp`, `as`, `ntp`, `sslvpn`, `drouting` und `ssh` existieren bereits eigene Kontexte mit Wert `0`.

Aktiviere einen benötigten Dienst ausdrücklich, beispielsweise `{$SERVICE.MONITOR:"sslvpn"}=1`. Die Zustände **untouched (0)** und **unregistered (7)** lösen keinen Dienst-Ausfallalarm aus. Der HA-Dienst wird nur bei aktiviertem HA berücksichtigt.

#### Dienste einzeln oder per Regex ausschließen

Auch für Dienste sind exakte Kontextnamen und Regex-Kontexte unter **Host > Makros** möglich. Verwende das Dienst-Suffix des Item-Keys, zum Beispiel `sslvpn` aus `sophos.service.sslvpn`, nicht den Anzeigenamen des Items.

**Einzelner Dienst:**

```text
Makro: {$SERVICE.MONITOR:"sslvpn"}
Wert:  0
```

**Zwei Dienste mit einem Makro – SSL-VPN und SSH:**

```text
Makro: {$SERVICE.MONITOR:regex:"^(sslvpn|ssh)$"}
Wert:  0
```

Dies schaltet die Dienst-Ausfallalarme für genau `sslvpn` und `ssh` aus. Die Statuswerte werden weiterhin abgefragt. Beide Beispieldienste sind im Template bereits über exakte Kontexte mit Wert `0` ausgenommen; der Regex zeigt, wie mehrere Dienste gemeinsam ausgewählt werden können.

**Vorrang beachten:** Exakte Kontexte haben Vorrang vor Regex-Kontexten, auch wenn die exakten Kontexte aus dem Template geerbt werden. Entferne nicht mehr benötigte Host-Einzelmakros, wenn sie durch einen Regex ersetzt werden sollen. Ein vorhandenes exaktes Host-Makro mit Wert `1` bleibt sonst eine bewusste Ausnahme und aktiviert den betreffenden Dienstalarm weiterhin.

Um einen der im Template standardmäßig ausgeschlossenen Dienste wieder zu überwachen, überschreibe dessen exakten Kontext am Host mit Wert `1`, beispielsweise `{$SERVICE.MONITOR:"sslvpn"}=1`. Ein Regex mit Wert `1` allein übersteuert den geerbten exakten Wert `0` nicht. Vermeide überlappende Regex-Kontexte mit unterschiedlichen Werten.

### CPU-Überwachung

Ab Version **1.0.3** ist die mittlere CPU-Auslastung aktiv integriert. Ein zusätzliches **Template Module HOST-RESOURCES-MIB CPU SNMP** ist dafür nicht erforderlich.

Die Abfrage entspricht dem von dir verwendeten Modul:

```text
discovery[{#CPU.UTIL},1.3.6.1.2.1.25.3.3.1.2]
```

Die Antwort enthält die `hrProcessorLoad`-Zeilen aller gemeldeten Prozessoren. Das Item **CPU: Average utilization** (`sophos.cpu.util`) bildet daraus mit JSONPath `$..['{#CPU.UTIL}'].avg()` den arithmetischen Mittelwert in Prozent. Vier Werte von 20, 40, 60 und 80 % ergeben beispielsweise **50 %**, nicht 200 %. Das entspricht dem Ansatz des [offiziellen Zabbix-CPU-Moduls](https://www.zabbix.com/integrations/snmp).

| Einstellung | Standard | Bedeutung |
|---|---:|---|
| `{$CPU.MONITOR}` | `1` | CPU-Alarme aktiv; `0` schaltet sie aus, Messwerte werden weiter abgefragt. |
| `{$CPU.UTIL.WARN}` | `90` | Prozent-Schwelle für den Gesamtwert und die optionalen Einzelkern-Alarme. |
| `{$CPU.UTIL.HYST}` | `5` | Hysterese für die Recovery in Prozentpunkten. |

Der Gesamtwert wird **jede Minute** abgefragt. Ein Lastalarm erfordert mindestens **fünf Messwerte im 5-Minuten-Fenster**, die alle über der Warnschwelle liegen. Bei 1-Minuten-Polling entspricht das typischerweise vier bis fünf Minuten Erkennungszeit. Einzelne Spitzen oder zu wenige Startwerte lösen diesen Alarm nicht aus. Der Alarm schließt erst bei einem frischen Wert unter Warnschwelle minus Hysterese, standardmäßig unter **85 %**.

Der Graph **Sophos: Average CPU utilization** stellt den Gesamtwert auf einer 0–100-%-Skala dar. Wenn bei weiterhin verfügbarem SNMP fünf Minuten lang kein verwendbarer CPU-Wert kommt, meldet **Sophos: No CPU data** ein Problem. Eine leere oder fehlerhafte Antwort wird nicht als 0 % interpretiert.

Für Details je Prozessor kannst du zusätzlich **CPU cores discovery (optional)** am Host aktivieren und „Jetzt ausführen“ wählen. Sie ist weiterhin standardmäßig deaktiviert und erzeugt pro SNMP-Index einen Messwert sowie einen eigenen Lastalarm. Die Gesamtüberwachung benötigt diese Discovery nicht. Die Schwellen- und MONITOR-Makros gelten auch für die optionalen Einzelkern-Alarme.

**Nach dem Update prüfen:** In „Aktuelle Daten“ das Item `sophos.cpu.util` aufrufen, „Jetzt ausführen“ wählen und einen plausiblen Prozentwert sowie den Graph kontrollieren. Bei „unsupported“ die genaue Fehlermeldung melden. Die OID stimmt mit deinem früheren Modul überein; die Antwort deiner aktuellen Firewall ist damit noch nicht geprüft. Parallel verknüpfte CPU-Templates können doppelte Messwerte und Alarme erzeugen.

### Systeminformationen und SNMP-Diagnose

Ab Version **1.0.4** enthält die Basisüberwachung zusätzlich:

| Item-Key | Inhalt | Intervall |
|---|---|---|
| `system.contact` | SNMP-Systemkontakt (`sysContact.0`) | 1 Stunde |
| `system.location` | SNMP-Standort (`sysLocation.0`) | 1 Stunde |
| `system.name` | Standard-Systemname (`sysName.0`) | 1 Stunde |
| `zabbix[host,snmp,available]` | Zabbix-Zustand der primären SNMP-Schnittstelle | 1 Minute |
| `net.if.type[<Index>]` | Interface-Typ (`ifType`) je entdecktem Interface | 1 Stunde |

Kontakt, Standort und Standard-Systemname sind den Inventarfeldern **Contact**, **Location** und **Name** zugeordnet. Für automatische Übernahme am Host den **Inventory mode / Inventarmodus** auf **Automatic / Automatisch** stellen. Der Import verändert den Inventarmodus nicht. Leere Kontakt-/Standortwerte sind gültig; in diesem Fall die Angaben auf der Sophos konfigurieren, sofern gewünscht.

`system.name` und `sophos.device.name` verwenden unterschiedliche OIDs. Eine Änderung des Standard-Systemnamens erzeugt eine **Information**; bei der ersten Messung oder einem neuen leeren Namen entsteht kein Änderungsalarm. Die Meldung schließt mit der nächsten unveränderten Messung, normalerweise nach einer Stunde. **Jetzt ausführen** kann diese Prüfung beschleunigen.

Die SNMP-Verfügbarkeit ist ein interner Zabbix-Wert: **0 = not available**, **1 = available**, **2 = unknown**. Sie benötigt keine zusätzliche SNMP-Abfrage. `unknown` kann nach dem Import oder vor der ersten Abfrage auftreten. Das Item erzeugt keinen zusätzlichen Verfügbarkeitsalarm; der bestehende **Sophos: No SNMP data**-Trigger überwacht weiterhin fehlende Uptime-Daten. Der interne Zustand richtet sich nach der Erreichbarkeitskonfiguration von Zabbix. [Zabbix: interne Checks](https://www.zabbix.com/documentation/7.4/en/manual/config/items/itemtypes/internal)

Der Interface-Typ besitzt Mappings für häufige Werte, etwa Ethernet, Loopback, Tunnel, VLAN und Link Aggregation. Weitere Typen bleiben als Zahlen sichtbar. Er dient der Einordnung und Historie; die bestehenden Discovery-Filter und Port-Alarme bleiben erhalten.

### Ressourcen und Interfaces

| Bereich | Warnung | Kritisch | Hysterese |
|---|---:|---:|---:|
| Disk | `{$DISK.UTIL.WARN}=85` | `{$DISK.UTIL.CRIT}=95` | `{$DISK.UTIL.HYST}=5` |
| RAM | `{$MEMORY.UTIL.WARN}=85` | `{$MEMORY.UTIL.CRIT}=95` | `{$MEMORY.UTIL.HYST}=5` |
| Swap | `{$SWAP.UTIL.WARN}=50` | `{$SWAP.UTIL.CRIT}=80` | `{$SWAP.UTIL.HYST}=5` |

Die Werte sind Prozent beziehungsweise Prozentpunkte. Die Warnschwelle muss unter der kritischen Schwelle liegen.

Für Interfaces gelten:

- `{$IF.UTIL.WARN}=90`: Auslastung in Prozent der gemeldeten Portgeschwindigkeit, über 15 Minuten gemittelt.
- `{$IF.UTIL.HYST}=5`: Erholung mit fünf Prozentpunkten Abstand zur Warnschwelle.
- `{$IF.ERRORS.WARN}=1` und `{$IF.DISCARDS.WARN}=1`: Rate pro **Sekunde**, über fünf Minuten gemittelt, je Richtung. Fehlerraten verwenden 20 % Hysterese.

Auslastungs- und Fehlerratenschwellen können einen Interface-Kontext erhalten, zum Beispiel `{$IF.ERRORS.WARN:"Port1"}`. Ein Wert von `1` bedeutet nicht einen Fehler pro fünf Minuten. Verwende positive, betrieblich passende Grenzwerte.

### Lizenzen

| Makro | Standard | Bedeutung |
|---|---:|---|
| `{$LICENSE.MONITOR}` | `1` | Lizenzalarme aktiv; kontextbezogen abschaltbar. |
| `{$LICENSE.EXPECTED}` | `0` | Fehlende/nicht abonnierte optionale Produkte erlaubt. Auf `1` setzen, wenn ein Produkt vorhanden sein muss. |
| `{$LICENSE.WARN.DAYS}` | `30` | Vorwarnung vor Ablauf. |
| `{$LICENSE.CRIT.DAYS}` | `7` | Kritische Vorwarnung; höchstens so groß wie die Warnfrist. |
| `{$LICENSE.DATE.ORDER}` | `YMD` | Reihenfolge numerischer Datumsbestandteile: `YMD`, `DMY` oder `MDY`. |

Lizenzkontexte: `base`, `network`, `web`, `email`, `webserver`, `zeroday`, `enhanced.support`, `enhanced.plus`, `central.orchestration`.

#### Lizenzen einzeln oder per Regex ausschließen

Unter **Host > Makros** kannst du einzelne Lizenzbereiche oder mehrere Bereiche mit einem Regex-Kontext auswählen. Verwendet werden die oben genannten Lizenz-Suffixe, nicht die vollständigen Produktnamen.

**Einzelne Lizenz – Email Protection:**

```text
Makro: {$LICENSE.MONITOR:"email"}
Wert:  0
```

**Email Protection und Web Protection gemeinsam ausschließen:**

```text
Makro: {$LICENSE.MONITOR:regex:"^(email|web)$"}
Wert:  0
```

Das betrifft genau `email` (**Email Protection**) und `web` (**Web Protection**). **Webserver Protection** hat den separaten Kontext `webserver` und ist in diesem Beispiel weiterhin überwacht. Soll stattdessen Email Protection zusammen mit Webserver Protection ausgeschlossen werden, verwende `{$LICENSE.MONITOR:regex:"^(email|webserver)$"}=0`.

Bei `LICENSE.MONITOR=0` entfallen für die ausgewählten Produkte Lizenzstatusalarme, Ablaufvorwarnungen und Formatdiagnosen. Status und Ablaufdatum werden weiterhin gesammelt. Andere Lizenzbereiche verwenden weiterhin ihren bisherigen Wert beziehungsweise den Standard `{$LICENSE.MONITOR}=1`.

Entferne entsprechende Host-Einzelmakros, wenn der Regex sie ersetzen soll. Ein exakter Kontext hat Vorrang: Mit `{$LICENSE.MONITOR:"web"}=1` kannst du Web Protection gezielt wieder überwachen, auch wenn der Regex `web` einschließt. Alternativ entfernst du `web` aus dem Regex. Vermeide mehrere überlappende Regex-Kontexte mit unterschiedlichen Werten. Die Syntax `regex:` wird nur in der Makrodefinition eingetragen; die Trigger bleiben unverändert.

Ab Version 1.0.2 nennt der Problemtext Produkt und gemeldeten Status, beispielsweise **Sophos: Webserver Protection license status: expired** oder **Sophos: Email Protection license status: deactivated**. Zabbix kann zusätzlich den numerischen Statuscode anzeigen. Der Ereignisname verwendet den Status bei Entstehung des Problems; die operativen Daten zeigen den aktuellen Status. Das Ablaufdatum ist ein separates Item.

Die Zustände **expired** und **deactivated** werden bei aktivierter Überwachung alarmiert. **none/not subscribed** lösen nur bei `LICENSE.EXPECTED=1` aus.

Der Parser behält den Rohtext bei und unterstützt:

- `2027-01-31`
- `31 Jan 2027` oder `Jan 31, 2027`
- numerische Daten nach der ausdrücklich eingestellten Reihenfolge, etwa `31/01/2027` mit `DMY`

Der gemeldete Wert `Dec 31 2999` wird ab Version 1.0.1 als gültiges Datum akzeptiert; der Parser erlaubt vierstellige Jahre von 2000 bis 9999. Er wird nicht pauschal in „perpetual“ umgewandelt: Lizenzstatus und ein später gemeldetes anderes Ablaufdatum bleiben prüfbar. Laut [aktueller Sophos-Dokumentation](https://docs.sophos.com/nsg/sophos-firewall/22.0/help/en-us/webhelp/onlinehelp/AdministratorHelp/Administration/Licensing/index.html) kann die Base-Lizenz auf Hardware beim End-of-Life auslaufen.

Numerische Datumsreihenfolgen werden nicht automatisch erraten. Timestamp `0` bedeutet leer/perpetual/N/A; `-1` bedeutet ein unbekanntes Format und erzeugt bei einem abonnierten beziehungsweise evaluierten Produkt einen INFO-Alarm. Das Datum wird als UTC-Ende des Tages behandelt, nicht als vertraglich bestätigte Ablaufsekunde.

## 6. Abfrageintervalle und Alarmverhalten

| Messung | Intervall / Einstellung |
|---|---|
| Statuswerte und mittlere CPU-Auslastung | 1 Minute |
| Interface-/VPN-Discovery | 15 Minuten |
| Interface-Speed | 5 Minuten |
| Lizenzstatus und Roh-Ablaufdatum | 1 Stunde |
| Systemkontakt, Standort, Standard-Systemname und Interface-Typ | 1 Stunde |
| Interne SNMP-Verfügbarkeit | 1 Minute |
| SNMP-No-data | `{$SNMP.NODATA}=5m` |
| Freshness Interface-Speed | `{$IF.SPEED.NODATA}=15m` |
| Freshness Lizenzdaten | `{$LICENSE.NODATA}=3h` |

VPN und Interfaces verwenden `FAIL.WINDOW=3m` und `FAIL.SAMPLES=3`, jeweils mit den Präfixen `VPN` beziehungsweise `IF`. Der Fehler muss in mindestens drei Messwerten vorkommen; im betrachteten Fenster dürfen keine als gesund beziehungsweise vom jeweiligen Trigger ausgeschlossenen Werte liegen. Die Erkennung dauert im normalen Raster ungefähr zwei bis drei Minuten, bei ausgefallenen Abfragen länger.

Ändere Zeitfenster, Mindestzahl und Polling nur abgestimmt: Das Fenster muss ausreichend Platz für die erforderlichen Messwerte enthalten. Dienste, HA und APs verwenden fest drei letzte Messwerte.

Wesentliche Regeln:

- **VPN:** Nur administrativ aktivierte, zur dauerhaften Überwachung ausgewählte Verbindungen lösen Down-/Partial-Alarme aus. Ein vorheriger Wechsel von „active“ zu „inactive“ ist keine Voraussetzung.
- **Interfaces:** Ein Link-Alarm setzt den aktuellen administrativen Zustand „up“ voraus. Down/notPresent/lowerLayerDown bleiben als Problem offen; Oper-up oder bewusste administrative Deaktivierung ermöglichen Recovery.
- **HA:** Faulty ist `4`; Standalone ist `2`. Lokaler und Peer-Fehler werden überwacht. Primary/Auxiliary/Ready sind keine Fehlerzustände.
- **Datenlücken:** Der SNMP-No-data-Alarm unterdrückt neue Folgealarme über Abhängigkeiten. Bestehende VPN-/Link-Probleme benötigen passende, frische Statuswerte für die Recovery.

## 7. Erste Inbetriebnahme prüfen

1. Führe die Interface- und IPsec-Discovery über **Jetzt ausführen / Execute now** aus.
2. Lasse etwa 15 Minuten Daten sammeln.
3. Prüfe unter **Monitoring > Latest data** beziehungsweise **Überwachung > Aktuelle Daten** Inventar, Uptime, Ressourcen, Dienste, HA und Lizenzen.
4. Kontrolliere Items und Discovery-Regeln auf **unsupported / nicht unterstützt** und lies die genaue Fehlermeldung.
5. Vergleiche VPN-Namen, Interface-Namen und Statuswerte mit der Sophos-Oberfläche.
6. Prüfe Lizenz-Rohdatum, Timestamp und `LICENSE.DATE.ORDER`.
7. Passe die Kontextmakros an, bevor du Benachrichtigungen für diesen Host produktiv verwendest.
8. Arbeite die [Testcheckliste](TESTING.txt) ab und beobachte die Daten über 24–48 Stunden.

Bei einem geplanten Test eines unkritischen VPNs beziehungsweise Ports muss ein anhaltender Ausfall über weitere Abfragen offen bleiben und nach der vorgesehenen Erholung schließen. Verwende dafür keinen produktiven Uplink oder HA-Port.

## 8. Optionale Funktionen aktivieren

Folgende Funktionen sind zunächst deaktiviert. Aktiviere sie bei Bedarf am Host und prüfe anschließend OID-Unterstützung und Datenmenge:

| Funktion | Hinweis |
|---|---|
| IPsec-VPN-Policies | Zusätzliche Policy-Informationen; keine Voraussetzung für Tunnelalarme. |
| WLAN-Access-Points | Status und Clientanzahl; `{$AP.MONITOR}` und `{$AP.CLIENTS.WARN}` steuern die Alarme. |
| WLAN-Clients | Kann viele kurzlebige Items erzeugen. |
| CPU-Cores | Zusätzliche Details pro SNMP-Index. Die mittlere CPU-Auslastung ist bereits aktiv integriert; die Einzelkern-Discovery muss separat aktiviert werden. |
| Sophos-Trap-Log | Benötigt einen separat konfigurierten Trap-Receiver mit numerischer OID-Ausgabe. |
| SNMP-Trap-Fallback | `snmptrap.fallback` sammelt empfangene Traps, die keinem anderen aktivierten Trap-Item zugeordnet werden. |

Das Trap-Item richtet keine Empfangsinfrastruktur ein und leitet keine Severity aus Freitext ab. Die mittlere CPU-Auslastung ist ab 1.0.3 Teil der aktiven Basisüberwachung; die tatsächliche OID-Antwort muss auf der aktuellen Firmware geprüft werden.

### SNMP-Trap-Fallback aktivieren

1. Richte den Trap-Empfang auf dem zuständigen Zabbix-Server oder Proxy ein und prüfe die Übergabe der Trap-Datei an Zabbix. Eine passende Zuordnung der Senderadresse zur SNMP-Schnittstelle des Hosts muss vorhanden sein.
2. Öffne am Host **Data collection > Hosts > Items** und aktiviere **SNMP traps: unmatched (optional)** mit dem Key `snmptrap.fallback`.
3. Aktiviere bei Bedarf zusätzlich **Sophos notifications (optional)**. Dieses Item benötigt numerische OIDs in der Receiver-Ausgabe.
4. Sende einen Test-Trap und kontrolliere unter **Latest data** die zugeordnete Log-Historie. Passende Traps landen im speziellen Item, übrige im Fallback.

Der Fallback ist ein Log ohne automatische Problemerzeugung. Er richtet weder den Receiver ein noch konfiguriert er die Sophos als Trap-Sender. Ein vorhandener Fallback aus einem anderen verknüpften Template mit demselben Key muss vor der Übernahme aufgelöst werden. [Zabbix: SNMP-Traps](https://www.zabbix.com/documentation/7.4/en/manual/config/items/itemtypes/snmptrap)

### ICMP als optionale Ergänzung

Für Ping-Erreichbarkeit, Paketverlust und Antwortzeit kann zusätzlich das offizielle **ICMP Ping**-Template aus deiner Zabbix-Installation verknüpft werden. Prüfe dafür ICMP-Freigabe auf der Sophos und die Voraussetzungen des zuständigen Servers/Proxys. ICMP-Messungen laufen unabhängig von SNMPv3. Unser Template benötigt keine ICMP-Verknüpfung; sie wird beim Import nicht automatisch angelegt.

## 9. Fehlersuche

| Symptom | Prüfung / nächste Maßnahme |
|---|---|
| Alle SNMP-Items ohne Daten | Management-IP, Port, zuständigen Proxy, Erreichbarkeit, Agent und Device-Access-Regeln prüfen. |
| SNMPv3-Authentifizierung scheitert | Benutzername, AuthPriv, Algorithmen und beide Passwörter auf Sophos und Zabbix abgleichen. |
| Nur einzelne OIDs unsupported | Konkrete OID mit der direkt heruntergeladenen Firewall-MIB vergleichen; genaue Fehlermeldung festhalten. |
| Keine VPNs entdeckt | SFOS-Version und Verfügbarkeit der IPsec-Tabelle prüfen; Discovery-Fehler ansehen. |
| Backup-VPN löst Alarm aus | `{$VPN.MONITOR:"exakter VPN-Name"}=0` setzen. |
| Unbenutzter Port löst Alarm aus | ifName ermitteln und `{$IF.MONITOR:"exakter ifName"}=0` setzen. |
| Standalone-HA wird erwartet | `{$HA.EXPECTED}=0` kontrollieren; gemeldete HA-Werte prüfen. |
| Lizenzdatum unbekannt | Rohtext ansehen; `YMD`/`DMY`/`MDY` passend wählen. Unbekannte Formate mit anonymisiertem Beispiel zurückmelden. |
| Traffic zunächst ohne Rate | Raten benötigen einen vorherigen Zählerwert. Ein Reset/Wrap kann einen Rate-Messwert verwerfen. |
| CPU-Discovery leer/unsupported | Optionale Regel wieder deaktivieren, solange der Firmware-Support nicht bestätigt ist. |
| Trap-Log leer | Receiver, Übergabe an Zabbix und numerische OID-Ausgabe prüfen. |

Bei SNMPv3-Problemen nach Gerätewechsel oder HA-Umschaltung zusätzlich die Engine-ID und das Verhalten des tatsächlich abfragenden Servers/Proxys prüfen. Die Engine-ID-Abfrage selbst kann durch die SNMP-Zugriffssicht eingeschränkt sein.

## 10. Updates und betriebliche Grenzen

Exportiere vor Änderungen deine angepasste Zabbix-Konfiguration. Importiere spätere Versionen über die vorhandene Vorlage und lasse bestehende Objekte aktualisieren. Aktiviere **„fehlende Objekte löschen“** nur, wenn deren Entfernung ausdrücklich beabsichtigt und geprüft ist.

Die Discovery-Keys basieren auf dem SNMP-Index. Das vermeidet problematische Item-Keys bei Namen mit Leerzeichen oder Kommas. Nach Reboot oder Firmwarewechsel können Indizes anders zugeordnet werden; prüfe deshalb Discovery, Namen und Historie.

Verlorene Discovery-Objekte werden nach **einer Stunde deaktiviert** und nach **sieben Tagen gelöscht**. Ein vollständig gelöschter, dauerhaft erwarteter Tunnel benötigt zusätzlich einen Inventar-Sollvergleich: Status-Polling allein bestätigt dessen Fortbestand nicht.

Ein erfolgreicher Import belegt nicht die Verfügbarkeit aller OIDs auf jeder SFOS-Version. Auch reale Counter-Raten, Gerätebelastung, LLD-Zeilen und HA-Failover stehen für deine XGS noch zur Prüfung aus.

### Update von 1.0.0 auf 1.0.1

1. Importiere die aktualisierte `sophos_xgs_snmp_7.4.yaml` und erlaube die Aktualisierung bestehender Templates und Items. „Fehlende Objekte löschen“ bleibt deaktiviert.
2. Lasse die bestehende Template-Verknüpfung und deine Host-Makros bestehen; kein Entkoppeln oder Neuanlegen ist erforderlich.
3. Öffne am Host das **SNMP-Rohwert-Item** `sophos.license.base.expiry` (Base firewall license expiry) und wähle **Jetzt ausführen / Execute now**. Das abhängige Timestamp-Item wird dadurch neu berechnet. Alternativ die nächste stündliche Abfrage abwarten.
4. Prüfe, dass der Timestamp nicht mehr `-1` ist und der INFO-Alarm zur Formaterkennung nach Verarbeitung des neuen Werts schließt. Der erwartete Timestamp für `Dec 31 2999` lautet `32503679999` (UTC-Ende des Tages).

Die tatsächlichen Lizenzstatusalarme für abgelaufene Email- und Webserver-Lizenzen bleiben aktiv. Die Korrektur ändert nur die Jahresgrenze des Datumsparsers und die Versionsangabe.

### Update auf 1.0.2: eindeutigere Lizenzmeldungen

Importiere die aktuelle YAML mit Aktualisierung bestehender Objekte und ohne Löschen fehlender Objekte. Die UUIDs, Item-Keys, Host-Makros, Schwellen und Trigger-Bedingungen bleiben erhalten. Die Status-Trigger aller neun Lizenzbereiche erhalten lesbare Produktnamen und einen Ereignisnamen mit dem gemeldeten Lizenzstatus statt „unavailable“.

**Bereits erzeugte Probleme behalten ihren gespeicherten Ereignisnamen.** Die neue Formulierung erscheint bei neu erzeugten Problemen. Ein erneuter Poll allein benennt ein weiterhin offenes Problem nicht um. Status und Ablaufdatum lassen sich währenddessen unter „Aktuelle Daten“ prüfen; der neue Trigger enthält außerdem operative Daten mit dem aktuellen Lizenzstatus.

### Update auf 1.0.3: aktive Gesamt-CPU-Überwachung

Importiere die aktuelle YAML mit Aktualisierung vorhandener Objekte und Erstellung fehlender Items, Trigger und Graphen. „Fehlende Objekte löschen“ bleibt deaktiviert. Bestehende UUIDs, Host-Makros und übrige Alarmbedingungen bleiben erhalten. Neu sind ein aktives CPU-Gesamtitem, zwei CPU-Alarme, ein Graph und die Makros `CPU.MONITOR` sowie `CPU.UTIL.HYST`. Die optionale Einzelkern-Discovery bleibt deaktiviert; ihre vorhandenen Alarme berücksichtigen nun ebenfalls diese Makros.

### Update auf 1.0.4: Ergänzungen aus dem bisherigen Setup

1. Importiere die neue YAML in das bestehende **Sophos XGS by SNMP**-Template. Erlaube **Create missing / Fehlende erstellen** und **Update existing / Bestehende aktualisieren** für Items, Trigger, Discovery-Regeln und Value-Maps. „Fehlende Objekte löschen“ bleibt deaktiviert.
2. Host-Verknüpfung und Host-Makros bleiben bestehen. Vor dem Update gegebenenfalls zusätzlich verknüpfte Generic-/Interface-Templates auf identische Item-Keys prüfen, insbesondere `system.name` und `snmptrap.fallback`.
3. Führe die **Network interfaces discovery** am Host aus. Der zusätzliche Typ wird für alle vom bisherigen Filter erfassten Interfaces angelegt.
4. Prüfe die neuen System-Items über **Jetzt ausführen**, danach die SNMP-Verfügbarkeit und Interface-Typen. Bei Bedarf automatischen Inventarmodus aktivieren.
5. Der neue Trap-Fallback bleibt deaktiviert. Bereits am Host angepasste Einstellungen bestehender optionaler Items nach jedem Update kontrollieren.

Die Version enthält **92 feste Items, 27 Item-Prototypen, 6 Discovery-Regeln und 45 Makros**. Deaktivierte optionale Funktionen sind in diesen Zahlen enthalten; die tatsächliche Host-Item-Anzahl hängt von Discovery-Ergebnissen ab.

Der Abgleich mit den vier alten Exporten bestätigt die Übernahme der Sophos-Messgrößen und des CPU-Mittelwerts. Die früher kumulativ gespeicherten HTTP-/POP3-/IMAP-/SMTP-Zähler bleiben bewusst Raten in `hits/s`; für den Vergleich historischer Kurven die unterschiedliche Bedeutung beachten. Die Interface-Discovery behält administrativ deaktivierte Ports und steuert ihre Alarmierung über den aktuellen Verwaltungsstatus. Das alte Generic-Modul verknüpfte außerdem ein nicht mitgeliefertes ICMP-Template; siehe optionale Ergänzung oben.

## 11. Validierung und Feedback

- Version 1.0.4: Import/Upgrade von 1.0.3, wiederholtes Update, erhaltene UUIDs und bestehende Item-IDs, Namensänderungs-Trigger (Erstwert, Änderung, leerer Wert, Recovery), neue Value-Maps/Inventarzuordnungen sowie Roundtrip und SNMPv3-Host-Verknüpfung geprüft. Details in `VALIDATION.json`.

Bereits erfolgreich geprüft:

- Version 1.0.3: Upgrade von 1.0.2, CPU-Graph, sechs native CPU-Preprocessing-Fälle (Einzel-/Mehrkern, Array-/JSON-Hülle, Dezimalwerte, leere und ungültige Antworten) sowie Anlaufentprellung, anhaltende Last, Hysterese und Recovery. Bestehende UUIDs bleiben erhalten.

- Version 1.0.2: Import/Update und tatsächliche Ereignisnamen für „expired“ und „deactivated“ in Zabbix 7.4.15; alle UUIDs und Trigger-Bedingungen bleiben erhalten.

- YAML-Import und wiederholtes Update in Zabbix 7.4.15.
- Export-Roundtrip sowie Vererbung von 92 festen Items an einen deaktivierten SNMPv3-AuthPriv-Testhost.
- Zehn synthetische VPN-/Interface-/HA-Zustandsfälle plus zwei Prüfungen für anhaltenden Fehler und Recovery.
- Reproduktion der drei gemeldeten Lizenzalarme mit simulierten Werten: Das Parser-Update schließt den falschen Format-INFO-Alarm; die beiden echten Statusalarme bleiben offen.
- 15 Datumsfälle im nativen Zabbix-JavaScript-Preprocessing, einschließlich des gemeldeten Werts `Dec 31 2999`, einer Komma- und ISO-Variante sowie eines ungültigen Schaltjahrestags im Jahr 2999.
- 88 Sophos-Item-OIDs sowie Vendor-Discovery-OIDs gegen die Upstream-MIB; eindeutige UUIDv4/Keys und definierte Makro-Basisnamen.

### Praxisfeedback zu Version 1.0.4

Der Anwender meldet am 09.10.2026 einen laufenden Betrieb mit positivem Gesamteindruck auf folgenden Geräten:

| Modell | SFOS-Version | Rückmeldung |
|---|---|---|
| XGS 2100 | 22.0.0 Build 411 | Template läuft; positiver Gesamteindruck |
| XGS 3300 | 22.0.0 Build 411 | Template läuft; positiver Gesamteindruck |
| XGS 138 | 22.0.1 MR-1 Build 490 | Template läuft; positiver Gesamteindruck |

Dies ist Praxisfeedback des Anwenders. Eine vollständige Liste unterstützter Items sowie gezielte Alarm-/Recovery- und HA-Failover-Tests wurden für diese Geräte noch nicht gemeldet. Zabbix-/Proxy-Version und HA-Konfiguration je Gerät sind nicht angegeben.

Der Agent hat keine reale Sophos selbst per SNMP abgefragt. Die oben genannten synthetischen Statusprüfungen verwenden die ursprünglichen Trigger-Ausdrücke mit simulierten Messwerten.

Für Feedback bitte Modell, exakte SFOS-Version, Zabbix-/Proxy-Version, Standalone/HA und betroffene Item-Keys/OIDs nennen. Ergänze genaue Fehlermeldungen, erwartete/beobachtete Zustände und gegebenenfalls ein anonymisiertes Lizenz-Rohdatum. Keine Passwörter mitsenden.

## 12. Quellen und Lizenz

Grundlagen, abgerufen am 09.10.2026:

- [Zabbix-Community: Sophos XG IPsec](https://github.com/zabbix/community-templates/tree/main/Network_Devices/template_sophos_xg_ipsec_vpn_version_21.0.x/7.0), geprüfter YAML-Git-Blob `9e5fd8be5065536acf168c7c05ae6227ab53a215`.
- [Pinet / Ali Erdem Sunar](https://github.com/pinetteam/sophos-xg-firewall-template/tree/21db4a3850995dc302662d6519490d4aeb132930), Revision `21db4a3850995dc302662d6519490d4aeb132930`.
- [Sophos SFOS 22: SNMP](https://docs.sophos.com/nsg/sophos-firewall/22.0/help/en-us/webhelp/onlinehelp/AdministratorHelp/Administration/SNMP/index.html).
- [Sophos SFOS 22: SNMPv3-Benutzer](https://docs.sophos.com/nsg/sophos-firewall/22.0/help/en-us/webhelp/onlinehelp/AdministratorHelp/Administration/SNMP/AdministrationSNMPUserAdd/index.html).
- [Zabbix 7.4: Template-Export/-Import](https://www.zabbix.com/documentation/7.4/en/manual/xml_export_import/templates).
- [Zabbix 7.4: SNMP-Items](https://www.zabbix.com/documentation/7.4/en/manual/config/items/itemtypes/snmp).
- [Zabbix 7.4: Trigger-Ausdrücke](https://www.zabbix.com/documentation/7.4/en/manual/config/triggers/expression).
- [Zabbix 7.4: History-Funktionen](https://www.zabbix.com/documentation/7.4/en/manual/appendix/functions/history).
- [Zabbix 7.4: Makros mit Kontext](https://www.zabbix.com/documentation/7.4/en/manual/config/macros/user_macros_context).
- [Zabbix 7.4: Preprocessing](https://www.zabbix.com/documentation/7.4/en/manual/config/items/preprocessing).

Die beigefügten MIT-Lizenzhinweise der Ursprungsprojekte bleiben Bestandteil des Pakets. Das Paket enthält keine Kopie der Sophos-MIB.
