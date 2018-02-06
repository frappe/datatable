/* global describe, it, before */

import chai from 'chai';
import DataManager, {
  DataError
} from '../src/datamanager';

chai.expect();
const expect = chai.expect;

describe.only('DataManager instance', () => {

  it('should initialize rows and columns given options', () => {
    const datamanager = getDataManagerInstance();
    expect(datamanager).has.property('rows');
    expect(datamanager).has.property('columns');
    expect(datamanager.rowCount).to.equal(3);
    expect(datamanager._serialNoColumnAdded).to.equal(false);
    expect(datamanager._checkboxColumnAdded).to.equal(false);
  });

  describe('prepareRows', () => {
    const datamanager = getDataManagerInstance();

    it('should properly build row object when bare minimum options are given', () => {
      const firstRow = datamanager.getRow(0);
      expect(firstRow).to.deep.equal([
        {
          colIndex: 0,
          content: 'Faris',
          rowIndex: 0
        },
        {
          colIndex: 1,
          content: 'faris@test.com',
          rowIndex: 0
        },
        {
          colIndex: 2,
          content: 'Software Developer',
          rowIndex: 0
        }
      ]);
    });

    it('should throw when rows parameter is not an Array', () => {
      expect(() => datamanager.init({
        columns: ['Name'],
        rows: 2
      })).to.throw(DataError, '`rows` must be an array');
    });

    it('should throw when any of the row\'s length doesn\'t match column length', () => {
      expect(() => datamanager.init({
        columns: ['Name'],
        rows: [[]]
      })).to.throw(DataError, 'column length');
    });

    it('should not throw given valid data', () => {
      expect(() => datamanager.init({
        columns: ['Name'],
        rows: [['Faris']]
      })).to.not.throw();
    });

  });

  describe('prepareColumns', () => {
    const datamanager = getDataManagerInstance();

    it('should properly build column object with bare minimum options', () => {
      const firstColumn = datamanager.getColumn(0);
      expect(firstColumn.colIndex).eq(0);
      expect(firstColumn.content).eq('Name');
      expect(firstColumn.isHeader).eq(1);
    });

    it('should throw when columns parameter is not an Array', () => {
      expect(() => datamanager.init({
        columns: 2
      })).to.throw(DataError, 'must be an array');
    });

    it('should throw when any of the column is not a string or object', () => {
      expect(() => datamanager.init({
        columns: [2]
      })).to.throw(DataError, 'must be a string or an object');
    });

    it('should not throw given valid params', () => {
      expect(() => datamanager.init({
        columns: ['Name'],
        rows: [['Test']]
      })).to.not.throw();
    });

    it('should properly build column object when editable is false', () => {
      const data = {
        columns: [
          { content: 'Name', editable: false }
        ],
        rows: [
          ['Faris']
        ]
      };
      datamanager.init(data);
      const firstColumn = datamanager.getColumn(0);
      expect(firstColumn.colIndex).eq(0);
      expect(firstColumn.content).eq('Name');
      expect(firstColumn.isHeader).eq(1);
    });
  });

  describe('prepareNumericColumns', () => {
    const datamanager = getDataManagerInstance();
    it('should assign `align: right` to columns with numeric data', () => {
      datamanager.init({
        columns: ['Name', 'Number'],
        rows: [
          ['Faris', '123']
        ]
      });

      const column0 = datamanager.getColumn(0);
      const column1 = datamanager.getColumn(1);
      expect(column0.align).to.not.equal('right');
      expect(column1.align).to.equal('right');
    });
  });
});

function getDataManagerInstance(opts = {}) {
  const options = Object.assign({}, {
    data: {
      columns: ['Name', 'Email', 'Occupation'],
      rows: [
        ['Faris', 'faris@test.com', 'Software Developer'],
        ['Manas', 'manas@test.com', 'Software Engineer'],
        ['Ameya', 'ameya@test.com', 'Hacker']
      ]
    }
  }, opts);

  const datamanager = new DataManager(options);
  datamanager.init();
  return datamanager;
}
