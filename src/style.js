import { camelCaseToDash } from './utils';

export default class Style {

  constructor(wrapper) {
    const styleEl = document.createElement('style');

    document.head.appendChild(styleEl);
    this.styleSheet = styleEl.sheet;
  }

  setStyle(rule, styleMap, index = -1) {
    const styles = Object.keys(styleMap)
      .map(prop => {
        if (!prop.includes('-')) {
          prop = camelCaseToDash(prop);
        }
        return `${prop}:${styleMap[prop]};`;
      })
      .join('');
    let ruleString = `${rule} { ${styles} }`;

    let _index = this.styleSheet.cssRules.length;
    if (index !== -1) {
      this.styleSheet.removeRule(index);
      _index = index;
    }

    this.styleSheet.insertRule(ruleString, _index);
    return _index;
  }
}
