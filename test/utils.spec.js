/* global describe, it, before */

import chai from 'chai';
import {
	makeDataAttributeString,
	getCSSString,
	buildCSSRule,
} from '../src/utils.js';

chai.expect();
const expect = chai.expect;

describe('#utils', () => {
  describe('makeDataAttributeString', () => {
    it('should return the correct data-attr string', () => {
      const props = {
        isHeader: 1,
        colIndex: 0,
        rowIndex: 4
      };

      expect(makeDataAttributeString(props))
        .to.be.equal('data-is-header="1" data-col-index="0" data-row-index="4"');
    });
  });

  describe('getCSSString', () => {
    it('should return CSS key value pairs', () => {
      const style = {
        width: '2px',
        height: '4px',
        'margin-top': '3px'
      };

      expect(getCSSString(style))
        .to.be.equal('width: 2px; height: 4px; margin-top: 3px;');
    });
  });

  describe('buildCSSRule', () => {
    it('should return CSS rule string with updated properties', () => {
      const rule = '.test';
      const style = {
        width: '2px',
        height: '4px',
        'margin-top': '3px'
      };

      const ruleString = buildCSSRule(rule, style);

      expect(ruleString)
        .to.be.equal('.test { width: 2px; height: 4px; margin-top: 3px; }');

      const updatedRuleString = buildCSSRule(rule, { width: '5px' }, ruleString);

      expect(updatedRuleString)
        .to.be.equal('.test { width: 5px; height: 4px; margin-top: 3px; }');

      const updatedRuleString2 = buildCSSRule(rule, { height: '19px' }, updatedRuleString);

      expect(updatedRuleString2)
        .to.be.equal('.test { width: 5px; height: 19px; margin-top: 3px; }');

      const updatedRuleString3 = buildCSSRule('.test2', { height: '45px' }, updatedRuleString2);

      expect(updatedRuleString3)
        .to.be.equal('.test { width: 5px; height: 19px; margin-top: 3px; }.test2 { height: 45px; }');
    });
  });
});
