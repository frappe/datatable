/* global DataTable */
/* eslint-disable no-unused-vars */

const {
    columns,
    data
} = getSampleData();

// Hero
let datatable1 = new DataTable('.example-1', {
    columns,
    data,
    checkboxColumn: true
});

// // Formatted Cells
// let datatable2 = new DataTable('.example-2', {
//     columns: ['Name', 'Position', 'Office', 'Extn.', 'Start Date',
//         { content: 'Salary', format: val => '$' + val, align: 'right' }],
//     data
// });

// // Inline Filters
// let datatable3 = new DataTable('.example-3', {
//     columns,
//     data,
//     enableInlineFilters: true
// });
// datatable3.showToastMessage('Click on a cell and press Ctrl/Cmd + F');

// // Keyboard
// let datatable4 = new DataTable('.example-4', {
//     columns,
//     data
// });
// datatable4.showToastMessage('Double click to edit');

// // Tree Structured Rows
// let datatable5 = new DataTable('.example-5', getTreeData());
// datatable5.showToastMessage('Expand/Collapse tree nodes');

function getSampleData(multiplier) {
    let columns = ['Name', 'Position', 'Office', {name: 'Extn.', width: 120}, 'Start Date', 'Salary'];
    let data = [
        ['Tiger Nixon', 'System Architect', 'Edinburgh', 5421, '2011/04/25', '320,800'],
        ['Garrett Winters', 'Accountant', 'Tokyo', 8422, '2011/07/25', '170,750'],
        ['Ashton Cox', 'Junior Technical Author', 'San Francisco', 1562, '2009/01/12', '86,000'],
        ['Cedric Kelly', 'Senior Javascript Developer', 'Edinburgh', 6224, '2012/03/29', '433,060'],
        ['Airi Satou', 'Accountant', 'Tokyo', 5407, '2008/11/28', '162,700'],
        ['Brielle Williamson', 'Integration Specialist', 'New York', 4804, '2012/12/02', '372,000'],
        ['Herrod Chandler', 'Sales Assistant', 'San Francisco', 9608, '2012/08/06', '137,500'],
        ['Rhona Davidson', 'Integration Specialist', 'Tokyo', 6200, '2010/10/14', '327,900'],
        ['Colleen Hurst', 'Javascript Developer', 'San Francisco', 2360, '2009/09/15', '205,500'],
        ['Sonya Frost', 'Software Engineer', 'Edinburgh', 1667, '2008/12/13', '103,600'],
        ['Jena Gaines', 'Office Manager', 'London', 3814, '2008/12/19', '90,560'],
        ['Quinn Flynn', 'Support Lead', 'Edinburgh', 9497, '2013/03/03', '342,000'],
        ['Charde Marshall', 'Regional Director', 'San Francisco', 6741, '2008/10/16', '470,600'],
        ['Haley Kennedy', 'Senior Marketing Designer', 'London', 3597, '2012/12/18', '313,500'],
        ['Tatyana Fitzpatrick', 'Regional Director', 'London', 1965, '2010/03/17', '385,750'],
        ['Michael Silva', 'Marketing Designer', 'London', 1581, '2012/11/27', '198,500'],
        ['Paul Byrd', 'Chief Financial Officer (CFO)', 'New York', 3059, '2010/06/09', '725,000'],
        ['Gloria Little', 'Systems Administrator', 'New York', 1721, '2009/04/10', '237,500'],
        ['Bradley Greer', 'Software Engineer', 'London', 2558, '2012/10/13', '132,000'],
        ['Dai Rios', 'Personnel Lead', 'Edinburgh', 2290, '2012/09/26', '217,500'],
        ['Jenette Caldwell', 'Development Lead', 'New York', 1937, '2011/09/03', '345,000'],
        ['Yuri Berry', 'Chief Marketing Officer (CMO)', 'New York', 6154, '2009/06/25', '675,000'],
        ['Caesar Vance', 'Pre-Sales Support', 'New York', 8330, '2011/12/12', '106,450'],
        ['Doris Wilder', 'Sales Assistant', 'Sidney', 3023, '2010/09/20', '85,600'],
        ['Angelica Ramos', 'Chief Executive Officer (CEO)', 'London', 5797, '2009/10/09', '1,200,000'],
        ['Gavin Joyce', 'Developer', 'Edinburgh', 8822, '2010/12/22', '92,575'],
        ['Jennifer Chang', 'Regional Director', 'Singapore', 9239, '2010/11/14', '357,650'],
        ['Brenden Wagner', 'Software Engineer', 'San Francisco', 1314, '2011/06/07', '206,850'],
        ['Fiona Green', 'Chief Operating Officer (COO)', 'San Francisco', 2947, '2010/03/11', '850,000'],
        ['Shou Itou', 'Regional Marketing', 'Tokyo', 8899, '2011/08/14', '163,000'],
        ['Michelle House', 'Integration Specialist', 'Sidney', 2769, '2011/06/02', '95,400'],
        ['Suki Burks', 'Developer', 'London', 6832, '2009/10/22', '114,500'],
        ['Prescott Bartlett', 'Technical Author', 'London', 3606, '2011/05/07', '145,000'],
        ['Gavin Cortez', 'Team Leader', 'San Francisco', 2860, '2008/10/26', '235,500'],
        ['Martena Mccray', 'Post-Sales support', 'Edinburgh', 8240, '2011/03/09', '324,050'],
        ['Unity Butler', 'Marketing Designer', 'San Francisco', 5384, '2009/12/09', '85,675'],
        ['Howard Hatfield', 'Office Manager', 'San Francisco', 7031, '2008/12/16', '164,500'],
        ['Hope Fuentes', 'Secretary', 'San Francisco', 6318, '2010/02/12', '109,850'],
        ['Vivian Harrell', 'Financial Controller', 'San Francisco', 9422, '2009/02/14', '452,500'],
        ['Timothy Mooney', 'Office Manager', 'London', 7580, '2008/12/11', '136,200'],
        ['Jackson Bradshaw', 'Director', 'New York', 1042, '2008/09/26', '645,750'],
        ['Olivia Liang', 'Support Engineer', 'Singapore', 2120, '2011/02/03', '234,500'],
        ['Bruno Nash', 'Software Engineer', 'London', 6222, '2011/05/03', '163,500'],
        ['Sakura Yamamoto', 'Support Engineer', 'Tokyo', 9383, '2009/08/19', '139,575'],
        ['Thor Walton', 'Developer', 'New York', 8327, '2013/08/11', '98,540'],
        ['Finn Camacho', 'Support Engineer', 'San Francisco', 2927, '2009/07/07', '87,500'],
        ['Serge Baldwin', 'Data Coordinator', 'Singapore', 8352, '2012/04/09', '138,575'],
        ['Zenaida Frank', 'Software Engineer', 'New York', 7439, '2010/01/04', '125,250'],
        ['Zorita Serrano', 'Software Engineer', 'San Francisco', 4389, '2012/06/01', '115,000'],
        ['Jennifer Acosta', 'Junior Javascript Developer', 'Edinburgh', 3431, '2013/02/01', '75,650'],
        ['Cara Stevens', 'Sales Assistant', 'New York', 3990, '2011/12/06', '145,600'],
        ['Hermione Butler', 'Regional Director', 'London', 1016, '2011/03/21', '356,250'],
        ['Lael Greer', 'Systems Administrator', 'London', 6733, '2009/02/27', '103,500'],
        ['Jonas Alexander', 'Developer', 'San Francisco', 8196, '2010/07/14', '86,500'],
        ['Shad Decker', 'Regional Director', 'Edinburgh', 6373, '2008/11/13', '183,000'],
        ['Michael Bruce', 'Javascript Developer', 'Singapore', 5384, '2011/06/27', '183,000'],
        ['Donna Snider', 'Customer Support', 'New York', 4226, '2011/01/25', '112,000']
    ];

    if (multiplier) {
        Array.from(new Array(multiplier - 1)).forEach(d => {
            data = data.concat(data);
        });
    }

    return {
        columns,
        data
    };
}

function getTreeData() {
    return {
        columns: [{
            'id': 'account',
            'content': 'Account'
        }, {
            'id': 'opening_debit',
            'content': 'Opening (Dr)'
        }, {
            'id': 'opening_credit',
            'content': 'Opening (Cr)'
        },
        // {
        //     'id': 'debit',
        //     'content': 'Debit'
        // },
        // {
        //     'id': 'credit',
        //     'content': 'Credit'
        // },
        {
            'id': 'closing_debit',
            'content': 'Closing (Dr)'
        }, {
            'id': 'closing_credit',
            'content': 'Closing (Cr)'
        }, {
            'id': 'currency',
            'content': 'Currency',
            'hidden': 1
        }],
        data: [{
            'account_name': 'Application of Funds (Assets)',
            'account': 'Application of Funds (Assets)',
            'parent_account': null,
            'indent': 0,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 12023729.54,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 12023729.54,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Current Assets',
            'account': 'Current Assets',
            'parent_account': 'Application of Funds (Assets)',
            'indent': 1,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 13960649.54,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 13960649.54,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Accounts Receivable',
            'account': 'Accounts Receivable',
            'parent_account': 'Current Assets',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 742790.474,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 742790.474,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Debtors',
            'account': 'Debtors',
            'parent_account': 'Accounts Receivable',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 742790.474,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 742790.474,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Bank Accounts',
            'account': 'Bank Accounts',
            'parent_account': 'Current Assets',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 280676.822,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 280676.822,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Corporation Bank',
            'account': 'Corporation Bank',
            'parent_account': 'Bank Accounts',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 290676.822,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 290676.822,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'HDFC Bank',
            'account': 'HDFC Bank',
            'parent_account': 'Bank Accounts',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 10000.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 10000.0,
            'has_value': true
        }, {
            'account_name': 'Cash In Hand',
            'account': 'Cash In Hand',
            'parent_account': 'Current Assets',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 229904.494,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 229904.494,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Cash',
            'account': 'Cash',
            'parent_account': 'Cash In Hand',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 229904.494,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 229904.494,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Stock Assets',
            'account': 'Stock Assets',
            'parent_account': 'Current Assets',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 12707277.75,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 12707277.75,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'All Warehouses',
            'account': 'All Warehouses',
            'parent_account': 'Stock Assets',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 12707277.75,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 12707277.75,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Finished Goods',
            'account': 'Finished Goods',
            'parent_account': 'All Warehouses',
            'indent': 4,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 87320.3,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 87320.3,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Retail Stores',
            'account': 'Retail Stores',
            'parent_account': 'All Warehouses',
            'indent': 4,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 4540590.0,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 4540590.0,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Bandra Store',
            'account': 'Bandra Store',
            'parent_account': 'Retail Stores',
            'indent': 5,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 3246800.0,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 3246800.0,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Central Warehouse',
            'account': 'Central Warehouse',
            'parent_account': 'Retail Stores',
            'indent': 5,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 1236790.0,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 1236790.0,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Lower Parel Store',
            'account': 'Lower Parel Store',
            'parent_account': 'Retail Stores',
            'indent': 5,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 57000.0,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 57000.0,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Stores',
            'account': 'Stores',
            'parent_account': 'All Warehouses',
            'indent': 4,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 8016525.27,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 8016525.27,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Work In Progress',
            'account': 'Work In Progress',
            'parent_account': 'All Warehouses',
            'indent': 4,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 62842.18,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 62842.18,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Fixed Assets',
            'account': 'Fixed Assets',
            'parent_account': 'Application of Funds (Assets)',
            'indent': 1,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 19920.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 19920.0,
            'has_value': true
        }, {
            'account_name': 'Electronic Equipments',
            'account': 'Electronic Equipments',
            'parent_account': 'Fixed Assets',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 80.0,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 80.0,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'Furnitures and Fixtures',
            'account': 'Furnitures and Fixtures',
            'parent_account': 'Fixed Assets',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 20000.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 20000.0,
            'has_value': true
        }, {
            'account_name': 'Temporary Accounts',
            'account': 'Temporary Accounts',
            'parent_account': 'Application of Funds (Assets)',
            'indent': 1,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 1917000.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 1917000.0,
            'has_value': true
        }, {
            'account_name': 'Temporary Opening',
            'account': 'Temporary Opening',
            'parent_account': 'Temporary Accounts',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 1917000.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 1917000.0,
            'has_value': true
        }, {
            'account_name': 'Source of Funds (Liabilities)',
            'account': 'Source of Funds (Liabilities)',
            'parent_account': null,
            'indent': 0,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 2371628.002,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 2371628.002,
            'has_value': true
        }, {
            'account_name': 'Current Liabilities',
            'account': 'Current Liabilities',
            'parent_account': 'Source of Funds (Liabilities)',
            'indent': 1,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 2371628.002,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 2371628.002,
            'has_value': true
        }, {
            'account_name': 'Accounts Payable',
            'account': 'Accounts Payable',
            'parent_account': 'Current Liabilities',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 368311.85,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 368311.85,
            'has_value': true
        }, {
            'account_name': 'Creditors',
            'account': 'Creditors',
            'parent_account': 'Accounts Payable',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 194871.85,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 194871.85,
            'has_value': true
        }, {
            'account_name': 'Salary Payable',
            'account': 'Salary Payable',
            'parent_account': 'Accounts Payable',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 173440.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 173440.0,
            'has_value': true
        }, {
            'account_name': 'Duties and Taxes',
            'account': 'Duties and Taxes',
            'parent_account': 'Current Liabilities',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 150146.822,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 150146.822,
            'has_value': true
        }, {
            'account_name': 'CGST',
            'account': 'CGST',
            'parent_account': 'Duties and Taxes',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 51479.591,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 51479.591,
            'has_value': true
        }, {
            'account_name': 'IGST',
            'account': 'IGST',
            'parent_account': 'Duties and Taxes',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 1944.0,
            'opening_credit': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 1944.0,
            'closing_credit': 0.0,
            'has_value': true
        }, {
            'account_name': 'SGST',
            'account': 'SGST',
            'parent_account': 'Duties and Taxes',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 97711.231,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 97711.231,
            'has_value': true
        }, {
            'account_name': 'UGST',
            'account': 'UGST',
            'parent_account': 'Duties and Taxes',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 2900.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 2900.0,
            'has_value': true
        }, {
            'account_name': 'Stock Liabilities',
            'account': 'Stock Liabilities',
            'parent_account': 'Current Liabilities',
            'indent': 2,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 1853169.33,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 1853169.33,
            'has_value': true
        }, {
            'account_name': 'Stock Received But Not Billed',
            'account': 'Stock Received But Not Billed',
            'parent_account': 'Stock Liabilities',
            'indent': 3,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 1853169.33,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 1853169.33,
            'has_value': true
        }, {
            'account_name': 'Equity',
            'account': 'Equity',
            'parent_account': null,
            'indent': 0,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 10000.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 10000.0,
            'has_value': true
        }, {
            'account_name': 'Capital Stock',
            'account': 'Capital Stock',
            'parent_account': 'Equity',
            'indent': 1,
            'from_date': '2018-04-01',
            'to_date': '2019-03-31',
            'currency': 'INR',
            'opening_debit': 0.0,
            'opening_credit': 10000.0,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 0.0,
            'closing_credit': 10000.0,
            'has_value': true
        }, {}, {
            'account': 'Total',
            'account_name': 'Total',
            'warn_if_negative': true,
            'opening_debit': 32260956.43,
            'opening_credit': 22618854.891999997,
            'debit': 0.0,
            'credit': 0.0,
            'closing_debit': 32260956.43,
            'closing_credit': 22618854.891999997,
            'parent_account': null,
            'indent': 0,
            'has_value': true,
            'currency': 'INR'
        }]
    };
}
