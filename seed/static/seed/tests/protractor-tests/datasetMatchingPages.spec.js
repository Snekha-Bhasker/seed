// check inventory pages after import and delete test dataset
var EC = protractor.ExpectedConditions;

// Check dataset matching and deleting Pages:
describe('When I go to the dataset options page', function () {
	it('should delete a single file', function () {
		browser.get("/app/#/data");
		$$('[ui-sref="dataset_detail({dataset_id: d.id})"]').first().click();
		var rows2 = element.all(by.repeater('f in dataset.importfiles'));
		expect(rows2.count()).toBe(2);
	});

	//Mapping
	it('should edit mappings', function () {
		$$('#data-mapping-1').first().click()
		expect($('.page_title').getText()).toContain('Data Mapping & Validation');
	});

	it('should have more than one mapped value', function () {
		//Need this?
		// $('[ng-change="setAllInventoryTypes()"]').element(by.cssContainingText('option', 'Tax Lot')).click();
		var cusRow = element.all(by.repeater('tcm in valids')).filter(function (rows) {
			expect(rows.length).not.toBeLessThan(1);
			return rows.$('[ng-model="tcm.suggestion_table_name"]').getText().then(function (label) {
				// expect(label).toEqual('Tax Lot');
				return;
			})
		});
	});

	it('should go to mapping Validation', function () {
		$$('[ng-click="get_mapped_buildings()"]').first().click();
		browser.wait(EC.presenceOf($('.inventory-list-tab-container.ng-scope')),30000);
		expect($('[heading="View by Property"]').isPresent()).toBe(true);
		expect($('[heading="View by Tax Lot"]').isPresent()).toBe(true);
		var rows = element.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows')).filter(function (elm) {
			expect(elm.length).not.toBeLessThan(1);
			return elm;
		});
	});

	//Matching
	it('should edit matching', function () {
		$$('[ui-sref="dataset_detail({dataset_id: import_file.dataset.id})"]').first().click();
		var rows = element.all(by.repeater('f in dataset.importfiles'));
		expect(rows.count()).toBe(2);
		$$('#data-matching-0').first().click()
	});

	it('should go to matching and have rows', function () {
		expect($('.page_title').getText()).toContain('Data Matching');
        expect($('.table_footer').getText()).toContain('4 unmatched');
		element(by.cssContainingText('#selected-cycle', browser.params.testOrg.cycle)).click();
        $('#showHideFilterSelect').element(by.cssContainingText('option', 'Show Matched')).click();
	});

	it('should check rows in matching and test filters', function () {	
		var rows = element.all(by.repeater('i in inventory'));
		expect(rows.count()).not.toBeLessThan(1);
		$$('[ui-sref="matching_detail({importfile_id: import_file.id, inventory_type: inventory_type, state_id: i.id})"]').first().click();
		rows = element.all(by.repeater('state in available_matches'));
		expect(rows.count()).not.toBeLessThan(1);
        $('[ng-change="unmatch()"]').click();
        browser.wait(EC.presenceOf($('.message')),10000);
        $('[ui-sref="matching_list({importfile_id: import_file.id, inventory_type: inventory_type})"]').click();
        expect($('.table_footer').getText()).toContain('5 unmatched');
        $('#showHideFilterSelect').element(by.cssContainingText('option', 'Show Unmatched')).click();
		$$('[ui-sref="matching_detail({importfile_id: import_file.id, inventory_type: inventory_type, state_id: i.id})"]').first().click();
        $$('[ng-change="checkbox_match(state)"]').first().click();
        browser.wait(EC.presenceOf($('.message')),10000);
        $('[ui-sref="matching_list({importfile_id: import_file.id, inventory_type: inventory_type})"]').click();
        $('#showHideFilterSelect').element(by.cssContainingText('option', 'Show All')).click();
        expect($('.table_footer').getText()).toContain('4 unmatched');
	});

});