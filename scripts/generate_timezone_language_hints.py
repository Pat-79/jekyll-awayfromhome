from collections import defaultdict
from pathlib import Path
from zoneinfo import available_timezones
import os
import pickle

import babel
from lxml import etree

BASE_ZONEINFO = Path('/usr/share/zoneinfo')
SUPPLEMENTAL_DATA = Path('/usr/share/liblangtag/common/supplemental/supplementalData.xml')
BABEL_GLOBAL = Path(os.path.dirname(babel.__file__)) / 'global.dat'
OUTPUT = Path('/home/patrick/Documents/website/jekyll-awayfromhome/_data/timezone_language_hints.yml')
OFFICIAL_STATUSES = {'official', 'de_facto_official'}


def load_babel_globals():
    with BABEL_GLOBAL.open('rb') as handle:
        return pickle.load(handle)


def load_zone_countries():
    zone_countries = {}
    for tab_path in (BASE_ZONEINFO / 'zone.tab', BASE_ZONEINFO / 'zone1970.tab'):
        with tab_path.open(encoding='utf-8') as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line or line.startswith('#'):
                    continue
                parts = line.split('\t')
                if len(parts) < 3:
                    continue
                countries = parts[0].split(',')
                timezone = parts[2]
                zone_countries.setdefault(timezone, countries)
    return zone_countries


def normalize_lang(code):
    normalized = (code or '').strip().replace('-', '_')
    if not normalized:
        return ''
    return normalized.split('_', 1)[0].lower()


def load_territory_language_counts():
    root = etree.parse(str(SUPPLEMENTAL_DATA))
    territory_counts = {}

    for territory in root.findall('.//territoryInfo/territory'):
        territory_code = territory.get('type')
        territory_population = float(territory.get('population') or 0)
        language_counts = defaultdict(float)

        for language_population in territory.findall('languagePopulation'):
            if language_population.get('officialStatus') not in OFFICIAL_STATUSES:
                continue

            language = normalize_lang(language_population.get('type'))
            if not language:
                continue

            population_percent = float(language_population.get('populationPercent') or 0)
            language_counts[language] += territory_population * population_percent / 100.0

        territory_counts[territory_code] = dict(language_counts)

    return territory_counts


def resolve_countries(timezone, zone_countries, zone_territories, zone_aliases):
    if timezone in zone_countries:
        return zone_countries[timezone]

    alias = zone_aliases.get(timezone)
    if alias and alias in zone_countries:
        return zone_countries[alias]

    if timezone in zone_territories:
        return [zone_territories[timezone]]

    if alias and alias in zone_territories:
        return [zone_territories[alias]]

    path = BASE_ZONEINFO.joinpath(*timezone.split('/'))
    if path.exists():
        real_path = Path(os.path.realpath(path))
        try:
            resolved = str(real_path.relative_to(BASE_ZONEINFO))
        except ValueError:
            resolved = ''

        if resolved in zone_countries:
            return zone_countries[resolved]

        if resolved in zone_territories:
            return [zone_territories[resolved]]

    return []


def languages_for_timezone(timezone, zone_countries, zone_territories, zone_aliases, territory_language_counts):
    speaker_counts = defaultdict(float)

    for country in resolve_countries(timezone, zone_countries, zone_territories, zone_aliases):
        for language, speaker_count in territory_language_counts.get(country, {}).items():
            speaker_counts[language] += speaker_count

    return [
        language
        for language, _ in sorted(speaker_counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def render_yaml(timezone_languages):
    lines = [
        '# Ordered official-language preference per IANA timezone.',
        '# Generated from all available system timezones, tzdb zone.tab/zone1970.tab,',
        '# and CLDR supplemental territoryInfo language populations.',
        '# Only official and de facto official languages are included.',
        '# Languages are sorted by estimated speaker count in the timezone area, high to low.',
        '# When the site builds, this file is filtered down to languages actually configured in site.languages.',
        '',
    ]

    for timezone in sorted(timezone_languages):
        languages = timezone_languages[timezone]
        if languages:
            lines.append(f'{timezone}:')
            for language in languages:
                lines.append(f'  - {language}')
        else:
            lines.append(f'{timezone}: []')
        lines.append('')

    return '\n'.join(lines).rstrip() + '\n'


def main():
    globals_data = load_babel_globals()
    zone_countries = load_zone_countries()
    territory_language_counts = load_territory_language_counts()
    zone_territories = globals_data['zone_territories']
    zone_aliases = globals_data['zone_aliases']

    timezone_languages = {}
    for timezone in available_timezones():
        timezone_languages[timezone] = languages_for_timezone(
            timezone,
            zone_countries,
            zone_territories,
            zone_aliases,
            territory_language_counts,
        )

    OUTPUT.write_text(render_yaml(timezone_languages), encoding='utf-8')


if __name__ == '__main__':
    main()
