import { format } from './utils';
import getTranslationsJSON from './translations';

export default class TranslationManager {
    constructor(instance) {
        this.instance = instance;
        this.language = this.instance.language;

        this.translations = getTranslationsJSON();
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

        return format(translation, args || {});
    }

    getPluralizedTranslation(translations, count) {
        return translations[count] || translations['default'];
    }
};
