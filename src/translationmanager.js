import { format } from './utils';

export default class TranslationManager {
    constructor(instance) {
        this.instance = instance;
        this.language = this.instance.language;

        this.translations = {
            en: {
                'Sort Ascending': 'Sort Ascending',
                'Sort Descending': 'Sort Descending',
                'Reset sorting': 'Reset sorting',
                'Remove column': 'Remove column',
                'No Data': 'No Data',
                '{0} cells copied': {
                    0: '{0} cells copied',
                    1: '{0} cell copied',
                    default: '{0} cells copied'
                },
                '{0} rows selected': {
                    0: '{0} rows selected',
                    1: '{0} row selected',
                    default: '{0} rows selected'
                }
            },
            de: {
                'Sort Ascending': 'Aufsteigend sortieren',
                'Sort Descending': 'Absteigend sortieren',
                'Reset sorting': 'Sortierung zurücksetzen',
                'Remove column': 'Spalte entfernen',
                'No Data': 'Keine Daten',
                '{0} cells copied': {
                    0: '{0} zellen kopiert',
                    1: '{0} zelle kopiert',
                    default: '{0} zellen kopiert'
                },
                '{0} rows selected': {
                    0: '{0} zeilen ausgewählt',
                    1: '{0} zeile ausgewählt',
                    default: '{0} zeilen ausgewählt'
                }
            }
        };
    }

    addCustomTranslations(translations) {
        this.translations = Object.assign(this.translations, translations);
    }

    translate(str, args) {
        let translation = (this.translations[this.language] && this.translations[this.language][str]) || str;

        if (typeof translation === 'object') {
            translation = args && args.count ?
                this.getPluralizedTranslation(translation, args.count) :
                str;
        }

        return format(translation, args ? args.args : []);
    }

    getPluralizedTranslation(translations, count) {
        return translations[count] || translations['default'];
    }
};
