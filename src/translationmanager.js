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

    translate(sourceText, args) {
        let translation = (this.translations[this.language] && this.translations[this.language][sourceText]) || sourceText;

        if (typeof translation === 'object') {
            translation = args && args.count ?
                this.getPluralizedTranslation(translation, args.count) :
                sourceText;
        }

        return format(translation, args || {});
    }

    getPluralizedTranslation(translations, count) {
        return translations[count] || translations['default'];
    }
};