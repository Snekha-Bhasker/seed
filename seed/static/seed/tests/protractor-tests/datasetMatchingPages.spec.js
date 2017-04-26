// check inventory pages after import and delete test dataset
var EC = protractor.ExpectedConditions;

// Check dataset matching and deleting Pages:
describe('When I go to the dataset options page', function () {
	it('should delete a single file', function () {
		browser.get("/app/#/data");
		
		$('[ng-click="open_data_upload_modal(d)"]').click();
		$('[ng-click="cancel()"]').click();
		$('[ng-click="edit_dataset_name(d)"]').click();
		$('[]ng-click="cancel_edit_name(d)"').click();
		$('[ng-click="edit_dataset_name(d)"]').click();
		$('#editDatasetName').sendKeys('2');
		$('[ng-click="save_dataset_name(d)"]').click();

		$$('[ui-sref="dataset_detail({dataset_id: d.id})"]').first().click();
		var rows = element.all(by.repeater('f in dataset.importfiles'));
		expect(rows.count()).toBe(2);

	});

	//Mapping
	it('should edit mappings', function () {
		var rows = element.all(by.repeater('f in dataset.importfiles'));
		expect(rows.count()).toBe(2);
		$$('#data-mapping-0').first().click()
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
		$$('[ng-click="open_cleansing_modal()"]').first().click();
		browser.wait(EC.presenceOf($('.modal-title')),30000);
		expect($('.modal-body.ng-scope').getText()).toContain('No warnings/errors');
		$$('[ng-click="close()"]').first().click();
		expect($('.modal-body.ng-scope').isPresent()).toBe(false);
		$$('[ui-sref="dataset_detail({dataset_id: import_file.dataset.id})"]').first().click();
	});


	it('should go to data page and select properties', function () {
        $$('#data-mapping-1').first().click();
        expect($('.page_title').getText()).toContain('Data Mapping & Validation');
    });

    it('should have more than one mapped value for properties', function () {
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

    it('should go to mapping Validation for properties', function () {
        $$('[ng-click="get_mapped_buildings()"]').first().click();
        browser.wait(EC.presenceOf($('.inventory-list-tab-container.ng-scope')),30000);       
        expect($('[heading="View by Property"]').isPresent()).toBe(true);
        expect($('[heading="View by Tax Lot"]').isPresent()).toBe(true);
        var rows = element.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows')).filter(function (elm) {
            expect(elm.length).not.toBeLessThan(1);
            return elm;
        });
        $$('[ng-click="open_cleansing_modal()"]').first().click();
        browser.wait(EC.presenceOf($('.modal-title')),30000);
        expect($('.modal-body.ng-scope').getText()).toContain('File Name:');
        var rows1 = element.all(by.repeater('row in cleansingResults'));
        expect(rows1.count()).toBe(3);
        $$('[ng-click="close()"]').first().click();
        expect($('.modal-body.ng-scope').isPresent()).toBe(false);
    });

    it('should see my organizations from dataset', function () {
    	$('#sidebar-accounts').click();
        var rows = element.all(by.repeater('org in orgs_I_own'));
        expect(rows.count()).not.toBeLessThan(1);
    });


    // Uncomment after data quality updates!

    it('should go to parent organization for data quality', function () {
        var myNewOrg = element(by.cssContainingText('.account_org.parent_org', browser.params.testOrg.parent))
            .element(by.xpath('..')).$('.account_org.right');
        
        expect(myNewOrg.isPresent()).toBe(true);

        browser.actions().mouseMove(myNewOrg).perform();
        myNewOrg.$$('a').first().click();
        var myOptions = element.all(by.css('a')).filter(function (elm) {
            return elm.getText().then(function(label) { 
                return label == 'Data Cleansing';
            });
        }).first();
        myOptions.click();
        expect($('.table_list_container').isPresent()).toBe(true);

        // var myOptions2 = element.all(by.repeater('rule in rules')).filter(function (elm) {
        //     return elm.$('span').getText().then(function(label) { 
        //         return label == 'Energy Score';
        //     });
        // }).last();
        // myOptions2.$('[ng-model="rule.min"]').clear().then(function(){
        //     myOptions2.$('[ng-model="rule.min"]').sendKeys('0');
        // });
        var rowCount = element.all(by.repeater('rule in rules'));

        //put back later
        // expect(rowCount.count()).toBe(17);
        
        // alternate way to select Min input in row 4
        $$('[ng-model="rule.min"]').get(3).click().clear().then(function(){
            $$('[ng-model="rule.min"]').get(3).sendKeys('0');
        });
        expect($('.table_list_container').isPresent()).toBe(true);
        $$('[ng-click="save_settings()"]').first().click();        
        browser.wait(EC.presenceOf($('.fa-check')),10000);
    });

    it('should go back to data page and select properties', function () {
        browser.get("/app/#/data");
        $$('[ui-sref="dataset_detail({dataset_id: d.id})"]').first().click();
        $$('#data-mapping-1').first().click();
        expect($('.page_title').getText()).toContain('Data Mapping & Validation');
    });

    it('should have more than one mapped value when Im back', function () {
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

    it('should go to mapping Validation again with updated quality check', function () {
        $$('[ng-click="get_mapped_buildings()"]').first().click();
        browser.wait(EC.presenceOf($('.inventory-list-tab-container.ng-scope')),30000);       
        expect($('[heading="View by Property"]').isPresent()).toBe(true);
        expect($('[heading="View by Tax Lot"]').isPresent()).toBe(true);
        var rows = element.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows')).filter(function (elm) {
            expect(elm.length).not.toBeLessThan(1);
            return elm;
        });
        $$('[ng-click="open_cleansing_modal()"]').first().click();
        browser.wait(EC.presenceOf($('.modal-title')),30000);
        expect($('.modal-body.ng-scope').getText()).toContain('File Name:');
        var rows1 = element.all(by.repeater('row in cleansingResults'));

        // once quality check stuff has been updated, add this back in.
        // expect(rows1.count()).toBe(2);

        $$('[ng-click="close()"]').first().click();
        expect($('.modal-body.ng-scope').isPresent()).toBe(false);
		$$('[ui-sref="dataset_detail({dataset_id: import_file.dataset.id})"]').first().click();
    });


	//Matching
	it('should go to matching and have rows', function () {
		$$('#data-matching-0').first().click()
		expect($('.page_title').getText()).toContain('Data Matching');
        expect($('.table_footer').getText()).toContain('4 unmatched');
		element(by.cssContainingText('#selected-cycle', browser.params.testOrg.cycle)).click();
        $('#showHideFilterSelect').element(by.cssContainingText('option', 'Show Matched')).click();
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
        $$('[ng-change="unmatch(i)"]').first().click()
		$$('[ui-sref="dataset_detail({dataset_id: import_file.dataset.id})"]').first().click();
	});


	//Pairing
	it('should edit pairing', function () {
		$$('#data-pairing-0').first().click()
		expect($('.page_title').getText()).toContain('Pair Properties to Tax Lots');
		element(by.cssContainingText('[ng-model="cycle.selected_cycle"] option', browser.params.testOrg.cycle)).click();
		browser.sleep(2000);

		// Gotta figure this out, remote has 1 unpaired.
		expect($('.pairing-text-left').getText()).toContain('Showing 18 Properties');
		expect($('.pairing-text-right').getText()).toContain('Showing 11 Tax Lots');
	});


	it('should edit delete pairings', function () {
		$$('.unpair-child').count().then( function (count) {
			for (var index = 0; index < count; index++) {
				// console.log('index: ', index, count)
				var option = $$('.unpair-child').first();
				option.click();
				browser.sleep(200);
			};
		});

		expect($$('.unpair-child').count()).toBeLessThan(1);
	}, 60000);

	it('should edit change pair view', function () {
		browser.sleep(2000);
		element(by.cssContainingText('[ng-change="inventoryTypeChanged()"] option', "Tax Lot")).click();
		// browser.wait(EC.presenceOf($('.inventory-list-tab-container.ng-scope')),30000);       
		expect($('.page_title').getText()).toContain('Pair Tax Lots to Properties');

		expect($('.pairing-text-right').getText()).toContain('Showing 18 Properties (18 unpaired)');
		expect($('.pairing-text-left').getText()).toContain('Showing 11 Tax Lots (11 unpaired)');

		browser.sleep(2000);
	});



	it('should edit drag pairs', function () {
		browser.ignoreSynchronization = true;
		// var dragElement = $$('.pairing-data-row.grab-pairing-left').first();
		var dragElement = element.all(by.repeater('row in newLeftData')).first();
		var dropElement = $$('.pairing-data-row-indent').first();
		var lastDropElement = $$('.pairing-data-row-indent').last();
		// console.log('drag: ', dragElement);
		// console.log('drop: ', dropElement);

		// drag doesn't work on chrome....so use click functionality
		dragElement.click();
		browser.sleep(200);
		dropElement.click();
		browser.sleep(200);
		lastDropElement.click();
		browser.sleep(200);

		expect($('.pairing-text-right').getText()).toContain('Showing 18 Properties (16 unpaired)');
		expect($('.pairing-text-left').getText()).toContain('Showing 11 Tax Lots (10 unpaired)');
		browser.sleep(2000);
	});

	//Delete
	it('should delete data stuffs', function () {
		browser.ignoreSynchronization = false;
		browser.get("/app/#/data");
		$$('[ui-sref="dataset_detail({dataset_id: d.id})"]').first().click();
		$$('.delete_link').get(1).click();
		$$('[ng-click="delete_file()"]').click();
		var rows = element.all(by.repeater('f in dataset.importfiles'));
		expect(rows.count()).toBe(1);
		$$('[ui-sref="dataset_list"]').first().click();
		$$('[ng-click="confirm_delete(d)"]').first().click();
		$$('[ng-click="delete_dataset()"]').first().click();
		rows = element.all(by.repeater('d in datasets'));
		expect(rows.count()).toBe(0);
	});
});