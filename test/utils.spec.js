/* global describe, it, before */

import chai from 'chai';
import {
	makeDataAttributeString
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
});
