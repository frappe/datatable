import { camelCaseToDash } from './utils';

export default class Style {

  constructor(wrapper) {
    const styleEl = document.createElement('style');

    document.head.appendChild(styleEl);
    this.styleSheet = styleEl.sheet;
  }

  setStyle(rule, styleMap) {
    const styles = Object.keys(styleMap)
      .map(prop => {
        if (!prop.includes('-')) {
          prop = camelCaseToDash(prop);
        }
        return `${prop}:${styleMap[prop]};`;
      })
      .join('');
    let ruleString = `${rule} { ${styles} }`;

    this.styleSheet.insertRule(ruleString, this.styleSheet.cssRules.length);
  }

  set(elements, styleMap) {
    if (!Array.isArray(elements)) {
      elements = [elements];
    }

    elements.map(element => {
      for (const prop in styleMap) {
        element.style[prop] = styleMap[prop];
      }
    });
  }

  unset(elements, styleProps) {
    if (!Array.isArray(elements)) {
      elements = [elements];
    }

    if (!Array.isArray(styleProps)) {
      styleProps = [styleProps];
    }

    elements.map(element => {
      for (const prop of styleProps) {
        element.style[prop] = '';
      }
    });
  }
}
