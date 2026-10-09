Sophos XGS by SNMP — 1.0.4 / Zabbix 7.4
Stand: 09.10.2026. Produktionsorientierter Testkandidat für deinen XGS-Praxistest.

Import: sophos_xgs_snmp_7.4.yaml unter Datensammlung > Templates > Import.
Danach ausschließlich „Sophos XGS by SNMP“ an einen Test-Host verknüpfen.
Die Vorlage ist eigenständig; kein zusätzliches Generic-SNMP-/Interface-Template
nötig. Bestehende Templates mit denselben OIDs vorher auf Doppelüberwachung prüfen.
Sie überschreibt die beiden Ursprungsvorlagen nicht. Eigene, stabile UUIDv4-IDs
ermöglichen spätere Updates. Beim Update keine fehlenden Objekte löschen lassen.

SNMPv3: Am SNMP-Interface des Hosts Benutzer, AuthPriv, passende Auth-/Privacy-
Algorithmen und Passwörter setzen. Keine Zugangsdaten stehen in der YAML.
Auf der Sophos SNMP-Agent und „Accept queries“ einschalten. Device-Access-/Local-
Service-ACL auf den tatsächlichen Zabbix-Server/Proxy beschränken. „Authorized
hosts“ sind laut Sophos Trap-Ziele und keine Liste zulässiger Abfragequellen.
SFOS 22 dokumentiert SHA256/SHA512 und AES; Optionen deiner Firmware und des
abfragenden Servers/Proxys müssen übereinstimmen. SNMPv2c wird nicht erzwungen.
Numerische OIDs benötigen keine lokal installierte Sophos-MIB zur Namensauflösung.
Die direkt von deiner Firewall heruntergeladene MIB bleibt der Firmware-Abgleich.

Umfang: 87 feste Items, 26 Item-Prototypen, 6 Discoveries, 45 Makros.
Aktiv: Inventar, Uptime/Engine-ID, mittlere CPU, RAM/Disk/Swap, Dienste, HA, neun Lizenzbereiche,
Live-Benutzer, HTTP/FTP/Mail-Zählerraten, Interfaces und IPsec-Verbindungen.
Interface-Traffic nutzt Counter64; Fehler/Discards liefern Float-Werte pro Sekunde.

Optional und zunächst deaktiviert: VPN-Policy-Discovery, AP-Discovery,
WLAN-Client-Discovery, CPU-Discovery und ein Trap-Log-Item. Aktivierung über die
Discovery-Regel bzw. das Item am Host. CPU nutzt hrProcessorLoad
1.3.6.1.2.1.25.3.3.1.2; dessen Unterstützung ist auf der XGS noch unbestätigt.
Traps benötigen einen separat eingerichteten Receiver mit numerischer OID-Ausgabe.
Das Log-Item errät keine Severity aus Freitext. WLAN-Clients können viele kurzlebige
Items erzeugen; nur bei Bedarf einschalten.

Wichtige Einstellungen (Host-Makros):
  {$HA.EXPECTED}=0                  Standalone erlaubt; für HA-Paar auf 1 setzen.
  {$VPN.MONITOR:"Tunnelname"}=0     Backup-/On-Demand-Tunnel nicht alarmieren.
  {$IF.MONITOR:"Portname"}=0        Unbenutzte Ports nicht alarmieren.
  {$SERVICE.MONITOR:"dienst"}=0    Nicht benötigten Dienst nicht alarmieren.
  {$LICENSE.MONITOR:"produkt"}=0   Produkt vollständig von Lizenzalarmen ausnehmen.
  {$LICENSE.EXPECTED:"network"}=1  Network-Lizenz muss vorhanden/abonniert sein.
Die Kontextnamen entsprechen VPN-Namen, ifName bzw. dem Item-Key-Suffix.
Lizenz-Suffixe: base, network, web, email, webserver, zeroday, enhanced.support,
enhanced.plus, central.orchestration. Standardmäßig lösen „expired“ und
„deactivated“ aus; „none/not subscribed“ nur mit LICENSE.EXPECTED=1.
Optionale Dienste pop3, imap4, smtp, ftp, as, ntp, sslvpn, drouting und ssh haben
bereits eigene MONITOR=0-Kontexte. Bei Bedarf ausdrücklich auf 1 setzen.

Status-Polling: 1 Minute; Discovery: 15 Minuten. Interface-Speed: 5 Minuten.
VPN-/Interface-Entprellung: FAIL.WINDOW=3m und FAIL.SAMPLES=3; mindestens drei
Fehlersamples ohne guten Sample im Zeitfenster. Je nach Abfrageraster normalerweise
ca. 2–3 Minuten nach Beginn, bei Aussetzern länger. Bei Änderungen an Fenster,
Samplezahl oder Polling müssen diese drei Größen zueinander passen. Fenster darf
nicht kleiner sein als für die Samplezahl erforderlich. Dienste/HA/AP verwenden
fest drei letzte Samples. AP-Status-Polling ist nach Aktivierung ebenfalls 1 Minute.
SNMP.NODATA=5m, IF.SPEED.NODATA=15m, LICENSE.NODATA=3h bei 1h Lizenz-Polling.

Ressourcenschwellen, Interface-Auslastung, Fehler/Discards und Lizenzvorwarnung sind
über Makros steuerbar. Fehler/Discards: Standard 1 Ereignis/Sekunde als 5-Minuten-
Mittelwert je Richtung; dies entspricht NICHT einem Fehler pro fünf Minuten.
Warn-/Kritisch-Schwellen müssen sinnvoll geordnet sein. Ressourcen/Interface-
Auslastung nutzen Hysterese, Fehlerraten 20%, Lizenzvorwarnungen einen Tag.

Lizenzdaten: Rohtext bleibt erhalten. Parser unterstützt ISO YYYY-MM-DD, kurze
englische Monatsnamen (31 Jan 2027 / Jan 31, 2027) und numerische Daten nach
LICENSE.DATE.ORDER=YMD, DMY oder MDY. Numerische Reihenfolge niemals automatisch
erraten lassen. Timestamp 0 bedeutet leer/perpetual/N/A, -1 bedeutet unbekanntes
Format mit INFO-Alarm. Datum wird als UTC-Ende des Tages behandelt; damit ist die
Vorwarnung tagesgenau, nicht die vertragliche Ablaufsekunde. Vorwarnung 30/7 Tage.

Betriebliche Grenzen: SFOS 20+ für die IPsec-Tabelle vorgesehen; konkrete Firmware-
und Modellunterstützung muss auf der Firewall geprüft werden. Einzelne OIDs können
unsupported sein. Die MIB aus Pinet belegt Struktur, nicht Verfügbarkeit auf deiner
Firmware. Engine-ID-Abfrage kann durch die SNMP-Zugriffssicht eingeschränkt sein.
LLD-Keys verwenden den SNMP-Index, damit Namen mit Leerzeichen/Kommas nicht zu
ungültigen Keys werden. Nach Reboot/Firmwarewechsel Indizes und Discovery prüfen;
bei Neuzuordnung kann Historie unter einem Index eine andere Zeile repräsentieren.
Verlorene LLD-Objekte werden nach 1h deaktiviert und nach 7d gelöscht. Für dauerhaft
zu erwartende, vollständig gelöschte Tunnel ist zusätzlich ein Inventar-Sollvergleich
nötig; Status-Polling allein beweist deren Fortbestand nicht.

Validierung: echter Import und wiederholtes Update in Zabbix 7.4.15, Export-Roundtrip,
Verknüpfung an deaktivierten SNMPv3-AuthPriv-Testhost, 12 Status-Regressionstests,
15 native Zabbix-Lizenzparser-Tests, numerischer MIB-Abgleich. Kein SNMP-Wire-Test
und kein Funktionstest auf einer realen Sophos. Details: VALIDATION.json / TESTING.txt.

Quellen (abgerufen 09.10.2026):
Community Sophos XG IPsec:
https://github.com/zabbix/community-templates/tree/main/Network_Devices/template_sophos_xg_ipsec_vpn_version_21.0.x/7.0
Geprüfte Datei: Git-Blob 9e5fd8be5065536acf168c7c05ae6227ab53a215;
letzte dateibezogene Revision 7894afb2f9b054a56820aec39baf264562e828e5.
Pinet / Ali Erdem Sunar:
https://github.com/pinetteam/sophos-xg-firewall-template/tree/21db4a3850995dc302662d6519490d4aeb132930
Sophos SNMP und SNMPv3:
https://docs.sophos.com/nsg/sophos-firewall/22.0/help/en-us/webhelp/onlinehelp/AdministratorHelp/Administration/SNMP/index.html
https://docs.sophos.com/nsg/sophos-firewall/22.0/help/en-us/webhelp/onlinehelp/AdministratorHelp/Administration/SNMP/AdministrationSNMPUserAdd/index.html
Zabbix 7.4 Export, Trigger, SNMP, Makrokontexte und Preprocessing:
https://www.zabbix.com/documentation/7.4/en/manual/xml_export_import/templates
https://www.zabbix.com/documentation/7.4/en/manual/config/triggers/expression
https://www.zabbix.com/documentation/7.4/en/manual/appendix/functions/history
https://www.zabbix.com/documentation/7.4/en/manual/config/items/itemtypes/snmp
https://www.zabbix.com/documentation/7.4/en/manual/config/macros/user_macros_context
https://www.zabbix.com/documentation/7.4/en/manual/config/items/preprocessing

Die YAML und ihre Ableitungen behalten die beigefügten MIT-Lizenzhinweise der
Ursprungsprojekte. Dieses Paket enthält keine Kopie der Sophos-MIB.

Update 1.0.1: Jahresgrenze von 2199 auf 9999 angehoben. „Dec 31 2999“ ist
nun ein gültiges Datum. Bestehende YAML erneut importieren (Objekte aktualisieren,
keine fehlenden Objekte löschen), dann das Rohwert-Item sophos.license.base.expiry
„Jetzt ausführen“ oder die nächste stündliche Abfrage abwarten. Host-Makros und
Template-Verknüpfung beibehalten. Details in README.md. Auf Hardware kann die
Base-Lizenz laut aktueller Sophos-Dokumentation beim End-of-Life auslaufen:
https://docs.sophos.com/nsg/sophos-firewall/22.0/help/en-us/webhelp/onlinehelp/AdministratorHelp/Administration/Licensing/index.html

Update 1.0.2: Lizenzprobleme nennen den Produktnamen und gemeldeten Status,
z.B. „Sophos: Webserver Protection license status: expired“. Der aktuelle Status
steht zusätzlich in den operativen Daten. Bestehende Problemereignisse behalten
ihren gespeicherten Text; neue Ereignisse verwenden die neue Formulierung.
IDs, Makros und Bedingungen unverändert. Update durch erneuten YAML-Import.

Portausnahmen: exakte Namen oder Regex-Kontexte unter Host > Makros verwenden.
Einzelport: {$IF.MONITOR:"Port4"}=0
Mehrere Ports: {$IF.MONITOR:regex:"^Port(4|5|6|F1|F2)$"}=0
Dies trifft genau Port4/Port5/Port6/PortF1/PortF2; Messwerte bleiben erhalten.
Entsprechende Einzelmakros können anschließend entfernt werden. Exakte Kontexte
haben Vorrang, z.B. {$IF.MONITOR:"Port4"}=1 als gezielte Ausnahme. Überlappende
Regex-Kontexte mit unterschiedlichen Werten vermeiden. Kein YAML-Update nötig.
Weitere Beispiele und Erläuterungen: README.md.

Lizenz- und Dienstausnahmen ebenfalls einzeln oder mit Regex konfigurieren:
- Einzelne Lizenz: {$LICENSE.MONITOR:"email"}=0
- Email + Web Protection: {$LICENSE.MONITOR:regex:"^(email|web)$"}=0
  web bezeichnet Web Protection; Webserver Protection hat den Kontext webserver.
  Status-, Ablauf- und Formatalarme ausgenommen; Messwerte bleiben erhalten.
- Einzelner Dienst: {$SERVICE.MONITOR:"sslvpn"}=0
- SSL-VPN + SSH: {$SERVICE.MONITOR:regex:"^(sslvpn|ssh)$"}=0
  Beide Beispieldienste sind bereits standardmäßig ausgenommen.
Exakte Kontexte haben Vorrang, auch die aus dem Template geerbten. Zum Aktivieren
eines standardmäßig ausgeschlossenen Dienstes seinen exakten Kontext am Host
auf 1 setzen; Regex=1 allein übersteuert geerbte exakte Kontexte mit Wert 0 nicht.
Überlappende Regex-Kontexte mit unterschiedlichen Werten vermeiden.

Update 1.0.3: aktive mittlere CPU-Auslastung über
discovery[{#CPU.UTIL},1.3.6.1.2.1.25.3.3.1.2] und JSONPath-Mittelwert.
Item sophos.cpu.util, Polling 1m, Graph „Sophos: Average CPU utilization“.
CPU.MONITOR=1, CPU.UTIL.WARN=90, CPU.UTIL.HYST=5. Mindestens fünf Messwerte
in fünf Minuten, alle über Schwelle, lösen Lastalarm aus; Recovery unter 85 %.
Einzelkern-Discovery bleibt optional. Nach YAML-Update Gesamtitem „Jetzt ausführen“
und plausiblen Prozentwert prüfen. Kein zusätzliches CPU-Template erforderlich.

CPU-Validierung 1.0.3: sechs native Preprocessing-Fälle, Anlaufentprellung,
anhaltende Last, Hysterese/Recovery, Upgrade von 1.0.2, Graph und Vererbung
von 87 Items an deaktivierten SNMPv3-Testhost geprüft. Die CPU-OID wurde
vom Benutzer aus dem früher verwendeten Modul bestätigt; aktuelle
Firewall-Antwort noch nicht durch den Agenten getestet.
Quelle zum CPU-Ansatz: https://www.zabbix.com/integrations/snmp

Update 1.0.4: Systemkontakt, Standort, Standard-Systemname (mit Info bei Änderung),
interne SNMP-Verfügbarkeit und Interface-Typ ergänzt. Kontakt/Standort/Name können
bei automatischem Inventarmodus in das Host-Inventar übernommen werden.
SNMP-Verfügbarkeit: 0=not available, 1=available, 2=unknown; Diagnose ohne
zusätzlichen Alarm. Trap-Fallback snmptrap.fallback optional/deaktiviert.
92 feste Items, 27 Prototypen; Update-, Inventar-, Trap- und ICMP-Hinweise in README.md.

Praxisfeedback des Anwenders, 09.10.2026, Template 1.0.4:
XGS 2100 und XGS 3300: SFOS 22.0.0 Build 411.
XGS 138: SFOS 22.0.1 MR-1 Build 490.
Laufender Betrieb mit positivem Gesamteindruck gemeldet. Vollständige Item-Abdeckung
und gezielte Alarm-/Recovery-/HA-Tests noch nicht gemeldet. Details: README.md.
