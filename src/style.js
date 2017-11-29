import { camelCaseToDash } from './utils';

export default class Style {

  constructor(datatable) {
    this.datatable = datatable;
    this.scopeClass = 'datatable-instance-' + datatable.constructor.instances;
    datatable.datatableWrapper.classList.add(this.scopeClass);

    const styleEl = document.createElement('style');
    datatable.wrapper.insertBefore(styleEl, datatable.datatableWrapper);
    this.styleEl = styleEl;
    this.styleSheet = styleEl.sheet;
  }

  destroy() {
    this.styleEl.remove();
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
    let ruleString = `.${this.scopeClass} ${rule} { ${styles} }`;

    let _index = this.styleSheet.cssRules.length;
    if (index !== -1) {
      this.styleSheet.deleteRule(index);
      _index = index;
    }

    this.styleSheet.insertRule(ruleString, _index);
    return _index;
  }
}
