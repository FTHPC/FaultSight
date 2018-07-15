var CHART_BAR = 1;
var CHART_PIE = 2;
var CHART_HIST = 3;
var FOCUS_INJECTIONS = 1;
var FOCUS_SIGNALS = 2;
var FOCUS_DETECTIONS = 3;
var TYPE_OF_INJECTED_FUNCTION = 1;
var BIT_LOCATION = 2;
var INJECTED_FUNCTIONS = 3;
var INJECTION_TYPE_FUNCTION = 4;
var INJECTIONS_MAPPED_TO_LINE = 5;
var UNEXPECTED_TERMINATION = 6;
var NUM_TRIAL_WITH_DETECTION = 7;
var DETECTED_BIT_LOCATION = 8;
var DETECTION_LATENCY = 9;
var REGION_ALL = 1;
var REGION_STENCIL = 2;
var REGION_SPECIFIC = 3;

var currentSettings = {};



//***************PAGE SETUP***************//


//Call this if we are at a function page
function initFunctionPage(){
	drawMyGraphs();

	//Set up navigation tree
	var navigationTree = getFunctionPageNavigationTree();
	bindNavTreeToPage(navigationTree);

	//Set up settings
	setupSettingsObject();
	getSettingsFromFile();
	clickBindInSettings();

	//Set up page itself
	clickBindInFunctionPage();
	setupGraphCreation(true);
}

function initCompareFunctionPage(){

	//Set up navigation tree
	var navigationTree = getCompareFunctionPageNavigationTree();
	bindNavTreeToPage(navigationTree);

	//Set up settings
	setupSettingsObject();
	getSettingsFromFile();
	clickBindInSettings();

	//Set up page itself
	clickBindInCompareFunctionPage();
}

function initCompareTrialsPage() {
	// Set up navigation tree
	var navigationTree = getCompareTrialsPageNavigationTree();
	bindNavTreeToPage(navigationTree);

	// Set up settings
	setupSettingsObject();
	getSettingsFromFile();
	clickBindInSettings();

	// Set up page itself
	clickBindInCompareTrialsPage();
}

function clickBindInCompareTrialsPage() {
	// Object to send to backend containing trial constraint
	var trialSelection = {
		'column': -1,
		'constraintType': -1,
		'constraint': -1,
		'filterColumn': -1,
		'filterConstraintType': -1,
		'filterConstraint': -1,
		'analysisColumn': {}
	};

	for (var key in databaseDetails['trials']) {
		var analysis = {
			'useEntry': false,
			'analysisType': -1,
		}
		trialSelection['analysisColumn'][key] = analysis;
	}

	// Statistical comparison click bind
	$("#comparison-statistics-anchor").click(function(e){
		e.preventDefault();

		if ($("#comparison-statistics-main-container").css('display') != 'none'){
			$("#comparison-statistics-anchor-up-icon").hide();
			$("#comparison-statistics-anchor-down-icon").show();
		} else {
			$("#comparison-statistics-anchor-up-icon").show();
			$("#comparison-statistics-anchor-down-icon").hide();
		}

		$("#comparison-statistics-main-container").slideToggle();

	});

	// Trial Sets Information click binds
	$("#trial-information-anchor").on("click", function(e) {
		var targetContainer = $("#trial-information-container");

		if (targetContainer.css('display') != 'none'){
			$("#trial-information-anchor-down-icon").show();
			$("#trial-information-anchor-up-icon").hide();
		} else {
			$("#trial-information-anchor-down-icon").hide();
			$("#trial-information-anchor-up-icon").show();
		}

		targetContainer.slideToggle();
		e.preventDefault();
	});

	$("#trial-information-a-anchor").on("click", function(e) {
		var targetContainer = $("#trial-information-a-container");

		if (targetContainer.css('display') != 'none'){
			$("#trial-information-a-anchor-down-icon").show();
			$("#trial-information-a-anchor-up-icon").hide();
		} else {
			$("#trial-information-a-anchor-down-icon").hide();
			$("#trial-information-a-anchor-up-icon").show();
		}

		targetContainer.slideToggle();
		e.preventDefault();
	});

	$("#trial-information-b-anchor").on("click", function(e) {
		var targetContainer = $("#trial-information-b-container");

		if (targetContainer.css('display') != 'none'){
			$("#trial-information-b-anchor-down-icon").show();
			$("#trial-information-b-anchor-up-icon").hide();
		} else {
			$("#trial-information-b-anchor-down-icon").hide();
			$("#trial-information-b-anchor-up-icon").show();
		}

		targetContainer.slideToggle();
		e.preventDefault();
	});

	// Filter section
	$('#trials-filter-column-selection > li > a').on("click",function(e) {
		var selectedColumn = this.text;
		trialSelection['filterColumn'] = selectedColumn;
		$(this).parents(".trials-filter-container").find("#selected-filter-text").text(this.text);
		e.preventDefault();
	});

	$('#trials-filter-type-selection > li > a').on("click",function(e) {
		var selectedType = $(this).attr("data-constraint-type");
		trialSelection['filterConstraintType'] = selectedType;
		$(this).parents(".trials-filter-type-container").find("#selected-filter-type-text").text(this.text);
		e.preventDefault();
	});

	// Constraint section
	$('#trials-constraint-column-selection > li > a').on("click",function(e) {
		var selectedColumn = this.text;
		trialSelection['column'] = selectedColumn;
		$(this).parents(".trials-constraint-container").find("#selected-constaint-text").text(this.text);
		e.preventDefault();
	});

	$('#trials-constraint-type-selection > li > a').on("click",function(e) {
		var selectedType = $(this).attr("data-constraint-type");
		trialSelection['constraintType'] = selectedType;
		$(this).parents(".trials-constraint-type-container").find("#selected-constraint-type-text").text(this.text);
		e.preventDefault();
	});

	$('#trials-analysis-column-selection > div > input').on("click",function(e) {
		console.log("checkbox");
		var selectedColumn = $(this).attr("data-analysis-column");
		var useEntry = trialSelection['analysisColumn'][selectedColumn]['useEntry'];
		trialSelection['analysisColumn'][selectedColumn]['useEntry'] = !useEntry;
	});

	$('#trials-analysis-column-selection > div > div > input').on("click",function(e) {
		console.log("radio");
		var selectedColumn = $(this).parent().parent().find('.analysis-column-checkbox').attr("data-analysis-column");
		console.log(selectedColumn);
		var analysisType = $(this).attr("data-analysis-type");
		trialSelection['analysisColumn'][selectedColumn]['analysisType'] = analysisType;
		console.log(trialSelection);
	});



	// Submit filter and constraint
	$('#compare-trials-submit-button').click(function(e) {
		// Set filter value
		var filterConstraint = $("#trial-filter-value").val();
		if (filterConstraint.trim() != "") {
			trialSelection['filterConstraint'] = filterConstraint;
		}

		// Set constraint value
		var constraintValue = $("#trial-constraint-value").val();
		trialSelection['constraint'] = constraintValue;

		// Verify that all fields have been set correctly
		var constraintSetCorrectly =
			trialSelection['column'] != -1 &&
			trialSelection['constraintType'] != -1;

		var filterSetCorrectly =
			(
				trialSelection['filterColumn'] == -1 &&
				trialSelection['filterConstraintType'] == -1 &&
				trialSelection['filterConstraint'] == -1
			) ||
			(
				trialSelection['filterColumn'] != -1 &&
				trialSelection['filterConstraintType'] != -1 &&
				trialSelection['filterConstraint'] != -1
			)

		var analysisTypeSetCorrectly = true;
		var performingAnalysis = false;
		console.log(trialSelection);
		for (var key in trialSelection['analysisColumn']) {
			console.log(key);
			if (analysisTypeSetCorrectly) {
				var columnObject = trialSelection['analysisColumn'][key];
				if (columnObject['useEntry']) {
					performingAnalysis = true;
					if (columnObject['analysisType'] == -1) {
						analysisTypeSetCorrectly = false;
					}
				}
			}
		}

		console.log("Set correctly: " + analysisTypeSetCorrectly);
		console.log("Performing: " + performingAnalysis);
		if (
			constraintSetCorrectly &&
			filterSetCorrectly &&
			analysisTypeSetCorrectly &&
			performingAnalysis
		) {
			compareTrials(trialSelection);
		} else {
			alert("Input fields invalid")
		}

		e.preventDefault();
	});
}

function compareTrials(comparisonObject){
	$.ajax({
	    url: '/generateTrialComparison',
	    data: JSON.stringify(comparisonObject),
	    contentType: 'application/json;charset=UTF-8',
	    type: 'POST',
	    success: function(response) {
	    	console.log(JSON.parse(response));
	    	var parsedResponse = JSON.parse(response);
	    	updateTrialComparisonPage(comparisonObject, parsedResponse)
	    },
	    error: function(error) {
		    console.log(error);
	    }
	});
}

function initApplicationPage(){
	//Set up navigation tree
	var navigationTree = getApplicationPageNavigationTree();
	bindNavTreeToPage(navigationTree);

	//Set up settings
	setupSettingsObject();
	getSettingsFromFile();
	clickBindInSettings();

	//Set up page itself
	setupGraphCreation(false);
	clickBindInMainPage();
	createMainPageGraph();
}



function drawMyGraphs(){
	// Draw MyGraphs (Default graphs for user - Determined in settings)
	for (var i = 0; i < myGraphList.length; i++){

		if (myGraphList[i][1].isEmpty){
            $("#my-graph-" + (i + 1)).append("<p>Attempted to create chart: <b>" + myGraphList[i][1].title + "</b>. Empty dataset returned. No chart will be generated.</p>");
        } else {
        	generateGraph(myGraphList[i], "#my-graph-" + (i + 1), "#my-graph-input-"+ (i + 1), "my-graph-" + (i+1) + "-svd", CHART_BAR);
	        $("#my-graph-save-button-" + (i+1)).fadeIn();
					$("#my-graph-save-svg-button-" + (i+1)).fadeIn();
        }

	}

	Prism.highlightAll(true, function(e){
	    for (var i = 1; i < numHighlights + 1; i++){
	        $('#injection-point-' + i).tooltipster({
			    trigger: 'click',
			    position: 'bottom',
	            content: $('#inline-tooltip-' + i),
	        });
	    }
	});

}

function getApplicationPageNavigationTree(){
	var emptyTree = [
	    {
	        text: "Entire Application",
	        state: { selected: true },
	        nodes: [
	            {
	                text:'Injected Functions',
	                nodes: [

	                ],
	            },
	            {
	                text:'Non-injected Functions',
	                nodes: [

	                ],
	            }
	        ],
	    },
	    {
	    	text: 'Compare Functions',
	    	href: "./compareFunctions"
	    },
			{
      	text:'Compare Trials',
      	href: "./compareTrials"
	    },
	    {
	    text: "Settings",
	    },
	];

	for (var i = 0; i < injectedFunctionList.length; i++){
	    emptyTree[0].nodes[0].nodes.push(
	        {
	            text: injectedFunctionList[i],
	            state: { expanded: false },
	            href: "./function/" + injectedFunctionList[i],
	            nodes: [
	                {
	                    text:"Code",
		                href:"#",
	                },
	                {
	                    text:"Visualization",
		                href:"#",
	                }
	            ]
	        }
	    );
	}

	for (var i = 0; i < notInjectedFunctionList.length; i++){
	    emptyTree[0].nodes[1].nodes.push(
	        {
	            text: notInjectedFunctionList[i],
	            state: { expanded: false },
	            href: "./function/" + notInjectedFunctionList[i],
	            nodes: [
	                {
	                    text:"Code",
		                href:"#",
	                },
	                {
	                    text:"Visualization",
		                href:"#",
	                }
	            ]
	        }
	    );
	}
	return emptyTree;
}


function getCompareFunctionPageNavigationTree(){
	var emptyTree = [
    {
        text: "Entire Application",
        state: { selected: false },
        href: "../",
        nodes: [
            {
                text:'Injected Functions',
                nodes: [

                ],
            },
            {
                text:'Non-injected Functions',
                nodes: [

                ],
            },
        ],
    },
    {
            	text:'Compare Functions',
            	href: "../compareFunctions"
    },
		{
            	text:'Compare Trials',
            	href: "../compareTrials"
    },
    {
    	text: "Settings",
    },
	];

	for (var i = 0; i < injectedFunctionList.length; i++){
	    emptyTree[0].nodes[0].nodes.push(
	        {
	            text: injectedFunctionList[i],
	            state: { expanded: false },
	            href: "../function/" + injectedFunctionList[i],
	            nodes: [
	                {
	                    text:"Code",
		                href:"#",
	                },
	                {
	                    text:"Visualization",
		                href:"#",
	                }
	            ]
	        }
	    );
	}

	for (var i = 0; i < notInjectedFunctionList.length; i++){
	    emptyTree[0].nodes[1].nodes.push(
	        {
	            text: notInjectedFunctionList[i],
	            state: { expanded: false },
	            href: "../function/" + notInjectedFunctionList[i],
	            nodes: [
	                {
	                    text:"Code",
		                href:"#",
	                },
	                {
	                    text:"Visualization",
		                href:"#",
	                }
	            ]
	        }
	    );
	}
	return emptyTree;
}

function getCompareTrialsPageNavigationTree(){
	var emptyTree = [
    {
        text: "Entire Application",
        state: { selected: false },
        href: "../",
        nodes: [
            {
                text:'Injected Functions',
                nodes: [

                ],
            },
            {
                text:'Non-injected Functions',
                nodes: [

                ],
            },
        ],
    },
    {
            	text:'Compare Functions',
            	href: "../compareFunctions"
    },
		{
            	text:'Compare Trials',
            	href: "../compareTrials"
    },
    {
    	text: "Settings",
    },
	];

	for (var i = 0; i < injectedFunctionList.length; i++){
	    emptyTree[0].nodes[0].nodes.push(
	        {
	            text: injectedFunctionList[i],
	            state: { expanded: false },
	            href: "../function/" + injectedFunctionList[i],
	            nodes: [
	                {
	                    text:"Code",
		                href:"#",
	                },
	                {
	                    text:"Visualization",
		                href:"#",
	                }
	            ]
	        }
	    );
	}

	for (var i = 0; i < notInjectedFunctionList.length; i++){
	    emptyTree[0].nodes[1].nodes.push(
	        {
	            text: notInjectedFunctionList[i],
	            state: { expanded: false },
	            href: "../function/" + notInjectedFunctionList[i],
	            nodes: [
	                {
	                    text:"Code",
		                href:"#",
	                },
	                {
	                    text:"Visualization",
		                href:"#",
	                }
	            ]
	        }
	    );
	}
	return emptyTree;
}

function getFunctionPageNavigationTree(){
	var emptyTree = [
    {
        text: "Entire Application",
        state: { selected: false },
        href: "../../",
        nodes: [
            {
                text:'Injected Functions',
                nodes: [

                ],
            },
            {
                text:'Non-injected Functions',
                nodes: [

                ],
            },
        ],
    },
    {
            	text:'Compare Functions',
            	href: "../../compareFunctions"
    },
		{
            	text:'Compare Trials',
            	href: "../../compareTrials"
    },
    {
    	text: "Settings",
    },
	];

	for (var i = 0; i < injectedFunctionList.length; i++){

	    if (functionList[i] === functionName){
	        emptyTree[0].nodes[0].nodes.push(
	            {
	                text: injectedFunctionList[i],
	                state: { expanded: true },
	                href: "#",
	                nodes: [
	                    {
	                        text:"Code",
		                    href:"#main-page-container",
	                        state: { selected: true },
	                    },
	                    {
	                        text:"Visualization",
		                    href:"#visualization-anchor",
	                    }
	                ]

	            }
	        );
	    } else {
	        emptyTree[0].nodes[0].nodes.push(
	            {
	                text: injectedFunctionList[i],
	                state: { expanded: false },
	                href: "../function/" + injectedFunctionList[i],
	                nodes: [
	                    {
	                        text:"Code",
		                    href:"#main-page-container",
	                    },
	                    {
	                        text:"Visualization",
		                    href:"#visualization-anchor",
	                    }
	                ]
	            }
	        );
	    }

	}

	for (var i = 0; i < notInjectedFunctionList.length; i++){
	    if (functionList[i] === functionName){
	        emptyTree[0].nodes[1].nodes.push(
	            {
	                text: notInjectedFunctionList[i],
	                state: { expanded: true },
	                href: "#",
	                nodes: [
	                    {
	                        text:"Code",
		                    href:"#main-page-container",
	                        state: { selected: true },
	                    },
	                    {
	                        text:"Visualization",
		                    href:"#visualization-anchor",
	                    }
	                ]
	            }
	        );
	    } else {
	        emptyTree[0].nodes[1].nodes.push(
	            {
	                text: notInjectedFunctionList[i],
	                state: { expanded: false },
	                href: "../function/" + notInjectedFunctionList[i],
	                nodes: [
	                    {
	                        text:"Code",
		                    href:"#main-page-container",
	                    },
	                    {
	                        text:"Visualization",
		                    href:"#visualization-anchor",
	                    }
	                ]
	            }
	        );
	    }

	}
	return emptyTree;
}

function bindNavTreeToPage(navigationTree){
	$('#tree').treeview({
	    data: navigationTree,
	    enableLinks: true,
	    onNodeSelected: function(event, data) {
	        if (data.text == "Settings"){
	            displaySettings();
	        }
	    },
	});
}










function setupSettingsObject(callback){
    currentSettings = {
		"myGraphList": [],
        "highlightValue": 0,
        "confidenceValue": 0,
        "customConstraints": {},
        "statisticalUseAllTrials": true,
        "statisticalStartTrial": 0,
        "statisticalEndTrial": 0,
        "useDynamic": true,
				"statisticalTostUseFormula": true,
				"statisticalTostDelta": 0,
    };
    $.each(databaseDetails, function(index,value){
        currentSettings.customConstraints[index] = [];
    });
    if (callback){
        callback();
    }
}

function displaySettings(){
    setupSettingsObject(function(){
        getSettingsFromFile();
    });

    $("#web-settings").modal({
        keyboard: false,
    });
}

function clickBindInSettings(){
	//TODO:Update this function to mirror constraint checkbox below. Is Better cleaner code.
	$(".settings-my-graph-checkbox").click(function(e){
	    var currCheckboxName = $(e.currentTarget).attr("name");
	    var searchString = "settings-my-graph-checkbox-";
	    var currIndex = currCheckboxName.indexOf(searchString) + searchString.length;
	    var currCheckboxVal = parseInt(currCheckboxName.substring(currIndex,currCheckboxName.length));
	    var listIndex = currentSettings.myGraphList.indexOf(currCheckboxVal);
	    if (listIndex == -1){
	        currentSettings.myGraphList.push(currCheckboxVal);
	        currentSettings.myGraphList.sort();
	    } else {
	        currentSettings.myGraphList.splice(listIndex, 1);
	    }
	});

	$(".settings-constraint-checkbox").click(function(e){
	    var currentTable = $(e.currentTarget).attr("data-table-name");
	    var currentColumn = $(e.currentTarget).attr("data-column-name");
	    var listIndex = currentSettings.customConstraints[currentTable].indexOf(currentColumn);
	    if (listIndex == -1){
	        currentSettings.customConstraints[currentTable].push(currentColumn);
	        currentSettings.customConstraints[currentTable].sort();
	    } else {
	        currentSettings.customConstraints[currentTable].splice(listIndex,1);
	    }
	});

	$("#settings-save").click(function(){
	    currentSettings.highlightValue = $("#highlight-value-input").val();
	    currentSettings.confidenceValue = $("#confidence-value-input").val();

	    // Statistical significance data
	    currentSettings.statisticalUseAllTrials = $("#statistical-use-all-trials").is(':checked')

	    if (currentSettings.statisticalUseAllTrials){
	    	currentSettings.statisticalStartTrial = 0;
    		currentSettings.statisticalEndTrial = 0;
	    } else {
	    	currentSettings.statisticalStartTrial = $("#statistical-trial-start").val().trim();
    		currentSettings.statisticalEndTrial = $("#statistical-trial-end").val().trim();
	    	if (
					parseInt(Number(currentSettings.statisticalStartTrial)) != currentSettings.statisticalStartTrial ||
    			parseInt(Number(currentSettings.statisticalEndTrial)) != currentSettings.statisticalEndTrial ||
    			currentSettings.statisticalStartTrial == "" || currentSettings.statisticalEndTrial == ""
				) {
						currentSettings.statisticalStartTrial = 0;
	    			currentSettings.statisticalEndTrial = 0;
	    			currentSettings.statisticalUseAllTrials = true;
	    	}

	    }

	    currentSettings.useDynamic = $("#use-dynamic-instructions-input").is(':checked');

			// TOST
			currentSettings.statisticalTostUseFormula = $("#statistical-tost-use-formula").is(':checked')
	    if (currentSettings.statisticalTostUseFormula){
	    	currentSettings.statisticalTostDelta = 0;
	    } else {
	    	currentSettings.statisticalTostDelta = $("#statistical-tost-formula-value").val().trim();
	    	if (
					parseInt(Number(currentSettings.statisticalTostDelta)) != currentSettings.statisticalTostDelta ||
    			currentSettings.statisticalTostDelta == ""
				) {
						currentSettings.statisticalTostDelta = 0;
	    			currentSettings.statisticalTostUseFormula = true;
	    	}
	    }

	    saveSettingsToFile();
	});

	$("#statistical-use-all-trials").click(function() {
        if ($(this).is(':checked')) {
            $("#statistical-trial-start").prop('disabled', true);
            $("#statistical-trial-end").prop('disabled', true);
        } else {
        	$("#statistical-trial-start").prop('disabled', false);
        	$("#statistical-trial-end").prop('disabled', false);
        }
  });

	$("#statistical-tost-use-formula").click(function() {
        if ($(this).is(':checked')) {
            $("#statistical-tost-formula-value").prop('disabled', true);
        } else {
        	$("#statistical-tost-formula-value").prop('disabled', false);
        }
  });

}

function saveSvgAsSvg(svgEl, name) {
		var config = {
			filename: name,
		}
		d3_save_svg.save(svgEl, config);
}

function clickBindInFunctionPage(){
	$('#see-entire').bind('click', function(e) {
	    // Triggering bPopup when click event is fired
	    $('#element_to_pop_up').bPopup();
	    // Prevents the default action to be triggered.
	    e.preventDefault();
	});

	//For saving graphs that you have just created
	$(".save-graph-button").click(function(e){
		var dataLocation = $(this).attr("data-location");
    saveSvgAsPng(document.getElementById(dataLocation), "diagram.png", {backgroundColor:"#FFF"});
	});

	//For saving graphs that you have just created
	$(".save-graph-svg-button").click(function(e){
		var dataLocation = $(this).attr("data-location");
    saveSvgAsSvg(document.getElementById(dataLocation), "svg-diagram.svg");
	});

	$(".save-graph-json-button").click(function(e) {
		var jsonData = localGeneratedGraph;
		saveDataAsJson(jsonData, "data");
	});


	// Click to toggle the display of the test-of-proportions results
	$("#test-of-proportions-header").click(function(e){

		if ($("#test-of-proportions-container").css('display') != 'none'){
			$("#test-of-proportions-up-icon").hide();
			$("#test-of-proportions-down-icon").show();
		} else {
			$("#test-of-proportions-up-icon").show();
			$("#test-of-proportions-down-icon").hide();
		}

		$("#test-of-proportions-container").slideToggle();

	});


  $("#test-of-proportions-link").click(function(e) {
	  e.preventDefault();
	});

	$("#missing-file-location-submit").click(function(e){
		e.preventDefault();

		missingFileObject = {
			'fileLocation': $("#missing-file-location").val().trim(),
			'functionName': functionName,
		};

		if (missingFileObject["fileLocation"] != ""){
			// Update file location in database
			$.ajax({
		        url: '/updateFileLocationInDatabase',
		        contentType: 'application/json;charset=UTF-8',
		        data: JSON.stringify(missingFileObject),
		        type: 'POST',
		        success: function(response) {
		        	// Refresh the page
		        	location.reload();
		        },
		        error: function(error) {
			        console.log(error);
		        }
	    	});
		}

	})
}

function clickBindInMainPage(){
	//For saving graphs that you have just created
	//Each save-graph-button class will have a data-location associated with it
	//This will contain the id of the svd we want to save
	$(".save-graph-button").click(function(e){
		var dataLocation = $(this).attr("data-location");
	    saveSvgAsPng(document.getElementById(dataLocation), "diagram.png", {backgroundColor:"#FFF"});
	});

	$(".save-graph-svg-button").click(function(e){
		var dataLocation = $(this).attr("data-location");
    saveSvgAsSvg(document.getElementById(dataLocation), "svg-diagram.svg");
	});

	$(".save-auto-graph-json-button").click(function(e){
		var jsonData = localAutoGeneratedGraph;
		saveDataAsJson(jsonData, "data");
	});

	$(".save-graph-json-button").click(function(e){
		var jsonData = localGeneratedGraph;
    saveDataAsJson(jsonData, "data");
	});
}


function saveDataAsJson(jsonData, fileName) {
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", fileName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}




function getSettingsFromFile(){
    $.ajax({
	        url: '/getSettingsFromFile',
	        contentType: 'application/json;charset=UTF-8',
	        type: 'GET',
	        success: function(response) {
    	        $(".settings-my-graph-checkbox").prop('checked', false);
    	        var parsedMyGraphList = JSON.parse(response.myGraphList)
    	        currentSettings.myGraphList = parsedMyGraphList;
	            for (var i = 0; i< parsedMyGraphList.length; i++){
	                $("input[name='settings-my-graph-checkbox-" + parsedMyGraphList[i] + "']").prop('checked', true);
	            }
                var parsedCustomConstraints = (response.customConstraints);
                $.each(parsedCustomConstraints, function(index,value){
                    if (index != "__name__"){
                        value = JSON.parse(value);
                        for (var j = 0; j<value.length;j++){
	                        $("input[data-table-name='" + index + "'][data-column-name='" + String(value[j]) + "']").prop('checked', true);
                            currentSettings.customConstraints[index].push(value[j]);
                        }
                    }
                });
                //Set up highlight value
                var highlightValue = response.highlightValue;
                currentSettings.highlightValue = highlightValue;
                $("#highlight-value-input").val(highlightValue);

                //Set up confidence value
                var confidenceValue = response.confidenceValue;
                currentSettings.confidenceValue = confidenceValue;
                $("#confidence-value-input").val(confidenceValue);

                // Set up statistical significance data
                currentSettings.statisticalUseAllTrials = response.statisticalUseAllTrials;
                $("#statistical-use-all-trials").attr("checked", currentSettings.statisticalUseAllTrials);
                if ($("#statistical-use-all-trials").is(':checked')) {
		            	$("#statistical-trial-start").prop('disabled', true);
		            	$("#statistical-trial-end").prop('disabled', true);
		        		} else {
		        			$("#statistical-trial-start").prop('disabled', false);
		        			$("#statistical-trial-end").prop('disabled', false);
		        		}

								// Set up TOST data
								currentSettings.statisticalTostUseFormula = response.statisticalTostUseFormula;
								$("#statistical-tost-use-formula").attr("checked", currentSettings.statisticalTostUseFormula);
                if ($("#statistical-tost-use-formula").is(':checked')) {
		            	$("#statistical-tost-formula-value").prop('disabled', true);
		        		} else {
		        			$("#statistical-tost-formula-value").prop('disabled', false);
		        		}

								currentSettings.statisticalTostDelta = response.statisticalTostDelta;
								$("#statistical-tost-formula-value").val(currentSettings.statisticalTostDelta);


				currentSettings.statisticalStartTrial = response.statisticalStartTrial;
				if (!currentSettings.statisticalUseAllTrials){
					$("#statistical-trial-start").val(currentSettings.statisticalStartTrial);
				} else {
					$("#statistical-trial-start").val("");
				}


				currentSettings.statisticalEndTrial = response.statisticalEndTrial;
				if (!currentSettings.statisticalUseAllTrials){
					$("#statistical-trial-end").val(currentSettings.statisticalEndTrial);
				} else {
					$("#statistical-trial-end").val("");
				}

				currentSettings.useDynamic = response.useDynamic;
				if (currentSettings.useDynamic){
					$("#use-dynamic-instructions-input").attr("checked", true);
				} else {
					$("#not-use-dynamic-instructions-input").attr("checked", true);
				}
	        },
	        error: function(error) {
		        console.log(error);
	        }
    });
}



function saveSettingsToFile(){
    $.ajax({
	        url: '/saveSettingsToFile',
	        contentType: 'application/json;charset=UTF-8',
	        data: JSON.stringify(currentSettings),
	        type: 'POST',
	        success: function(response) {
	        },
	        error: function(error) {
		        console.log(error);
	        }
    });
}




//***************GRAPH CREATION***************//


function generateGraph(graph, locationId, inputId, svdIdName, chartType){
	if (graph[1].type === "single" && chartType == CHART_BAR){
        drawGraph(graph, locationId, svdIdName);
    } else if (graph[1].type === "single" && chartType == CHART_PIE){
        pieChartMainApplicationGraph(graph, locationId, svdIdName);
    } else if (graph[1].type === "multiple" && chartType == CHART_BAR){
        showStackedInput(inputId);
        stackedBarGraph(graph, locationId, inputId, svdIdName);
    } else if (graph[1].type === "multiple" && chartType == CHART_PIE){
        pieChartDonutStacked(graph, locationId, svdIdName);
    }
}

function createGraph(queryObject, svdIdName){
	$("#mplplot").empty();
	$.ajax({
	    url: '/createGraph',
	    data: JSON.stringify(queryObject),
	    contentType: 'application/json;charset=UTF-8',
	    type: 'POST',
	    success: function(response) {
            var graph = JSON.parse(response);
            hideStackedInput("#mplplot-input");
            if (graph[1].isEmpty){
                // alert("Empty dataset returned. No chart will be generated.");
                $("#mplplot").append("<b>Empty dataset returned. No chart will be generated.</b>")
            } else {
							localGeneratedGraph = graph;
            	generateGraph(graph, "#mplplot", "#mplplot-input", svdIdName, queryObject.type)
            }
	    },
	    error: function(error) {
		    console.log(error);
	    }
	});
}

function hideStackedInput(location){
    $(location).hide();
}
function showStackedInput(location){
    $(location).show();
}


function createMainPageGraph(){
		localAutoGeneratedGraph = mainGraphList[0];
    pieChartMainApplicationGraph(mainGraphList[0], "#main-page-graph", "main-page-graph-svd");
}


function drawGraph(allData, drawLocation, svdIdName) {
    var data = allData[0];
    var axisData = allData[1];

	var width = 1000, height = 500;
	var margin = {top: 40, right: 20, bottom: 40, left: 40};
    var legendWidth = 200;

	//x and y Scales
	var xScale = d3.scale.ordinal()
	    .rangeRoundBands([0, width], .1);

	var yScale = d3.scale.linear()
	    .range([height, 0]);

	xScale.domain(data.map(function(d) { return d.x; }));
	yScale.domain([0, d3.max(data, function(d) { return d.y; })]);

	//x and y Axes
	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left")

    var color = d3.scale.linear().domain([0,data.length -1])
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

	//create svg container
	var svg = d3.select(drawLocation)
	    .append("svg")
	    .attr("id", svdIdName)
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScale.domain(data.map(function(d) { return d.x; }));
	yScale.domain([0, d3.max(data, function(d) { return d.y; })]);

	//create bars
	var bars = svg.selectAll(".bar")
	    .data(data);

	bars.enter()
	    .append("rect")
	    .attr("class", "bar")


	bars.transition()
		.duration(100)
	    .attr("x", function(d) { return xScale(d.x); })
	    .attr("width", xScale.rangeBand())
	    .attr("y", function(d) { return yScale(d.y); })
	    .attr("height", function(d) { return height - yScale(d.y) ; })
        .style("fill", function(d, i) { return color(i); });

	var tooltip = d3.select(drawLocation)
      	.append('div')
      	.attr('class', 'tooltip-d3')
       	.style("left", ((width-legendWidth)/2) + "px")
  		.style("top", (height/2 + legendWidth/2) + "px");

    tooltip.append('div')
      	.attr('class', 'functionLabel');

    tooltip.append('div')
      	.attr('class', 'count');

    tooltip.append('div')
      	.attr('class', 'percent');

    bars.on('mouseover', function(d) {
		var total = d3.sum(data.map(function(d) {
	  		return d.y;
	    }));

	    var percent = Math.round(1000 * d.y / total) / 10;
	    tooltip.select('.functionLabel').html(d.x);
	    tooltip.select('.count').html("Injections: " + d.y);
	    tooltip.select('.percent').html(percent + '%');

	    tooltip.style('display', 'block');
  	});


  	bars.on('mouseout', function() {
    	tooltip.style('display', 'none');
  	});

    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);


	//drawing the x axis on svg
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

    svg.append("g")
        .append("text")
        .attr("x",(width - 40)/2)
        .attr("y",height + margin.bottom - 10)
        .text(axisData['x']);

	//drawing the y axis on svg
	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text(axisData['y']);

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(axisData.title);
};


function stackedBarGraph(allData, drawLocation, inputLocation, svdIdName){
    var axisData = allData[1];
    var legendWidth = 200;
    var data = allData[0];
    var n = allData[1].layers, // number of layers
        m = allData[1].samples, // number of samples per layer
        stack = d3.layout.stack(),
        layers = stack(allData[0]),
        yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
        yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

    var margin = {top: 40, right: 100, bottom: 40, left: 30},
        width = 1100 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .domain(axisData.barLabels)
        .rangeRoundBands([0, width], .08);

    var y = d3.scale.linear()
        .domain([0, yStackMax])
        .range([height, 0]);

    var color = d3.scale.linear().domain([0,n-1])
		.interpolate(d3.interpolateHcl)
		.range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickSize(0)
        .tickPadding(6)
        .orient("bottom")
				;

    var yAxis = d3.svg.axis()
	    .scale(y)
        .tickSize(1)
        .tickPadding(6)
	    .orient("left")

    var svg = d3.select(drawLocation).append("svg")
		.attr("id", svdIdName)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var layer = svg.selectAll(".layer")
        .data(layers)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return color(i); });

    var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
      	.enter().append("rect")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", height)
        .attr("width", x.rangeBand())
        .attr("height", 0);

    rect.transition()
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

	var tooltip = d3.select(drawLocation)
      	.append('div')
	  	.attr('class', 'tooltip-d3')
	    .style("left", ((width-legendWidth)/2) + "px")
    	.style("top", (height/2 + legendWidth/2) + "px");

    tooltip.append('div')
        .attr('class', 'functionLabel');

    tooltip.append('div')
        .attr('class', 'count');

    tooltip.append('div')
        .attr('class', 'percent');


	var total = 0;
	data.map(function(d) {
	    d.map(function(d2){total += d2.y;})
	});

    rect.on('mouseover', function(d) {
	    var percent = Math.round(1000 * d.y / total) / 10;
	    tooltip.select('.functionLabel').html(axisData['x'] + ": " + d.x);
	    tooltip.select('.count').html(axisData['y'] + ": " + d.y);
	    tooltip.select('.percent').html(percent + '%');
	    tooltip.style('display', 'block');
    });

    rect.on('mouseout', function() {
    	tooltip.style('display', 'none');
    });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text(axisData['y']);

    svg.append("g")
        .append("text")
        .attr("x",(width - 40)/2)
        .attr("y",height + margin.bottom - 10)
        .text(axisData['x']);

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(axisData.title);

    svg.append("g")
		.attr("class", "legendOrdinal")
		.attr("transform", "translate(" + (width - 10) + ",0)");

    var linearColor = d3.scale.linear().domain([1,n])
      	.interpolate(d3.interpolateHcl)
      	.range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    var legendColor = d3.scale.ordinal()
        .domain(["Arith-FP", "Pointer", "Arith-Fix", "Ctrl-Loop", "Ctrl-Branch"])
        .range(linearColor.ticks(n-1).map(linearColor));

    var legendOrdinal = d3.legend.color()
      	.shape("rect")
      	.shapeWidth(30)
      	.shapePadding(10)
      	.scale(legendColor);

    svg.select(".legendOrdinal")
      	.call(legendOrdinal);

    d3.selectAll(inputLocation).selectAll("input").on("change", change);


    function change() {
		//clearTimeout(timeout);
		if (this.value === "grouped") transitionGrouped();
		else transitionStacked();
    }

    function transitionGrouped() {
		y.domain([0, yGroupMax]);
		yAxis.scale(y);

		svg.selectAll("g.y.axis")
			.call(yAxis);

		rect.transition()
			.duration(500)
		  	.delay(function(d, i) { return i * 10; })
		  	.attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
		  	.attr("width", x.rangeBand() / n)
		  	.transition()
			.attr("y", function(d) { return y(d.y); })
		  	.attr("height", function(d) { return height - y(d.y); });
    }

    function transitionStacked() {
		y.domain([0, yStackMax]);
		yAxis.scale(y);

		svg.selectAll("g.y.axis")
			.call(yAxis);

		rect.transition()
		  	.duration(500)
		  	.delay(function(d, i) { return i * 10; })
		  	.attr("y", function(d) { return y(d.y0 + d.y); })
		  	.attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
			.transition()
		  	.attr("x", function(d) { return x(d.x); })
		  	.attr("width", x.rangeBand());
    }
}

function pieChartMainApplicationGraph(allData,location, svdIdName){
    var data = allData[0];
    var axisData = allData[1];
    var width = 600;
    var height = 500;
    var radius = Math.min(width, height) / 2;
    var min = Math.min(width, height);
    var oRadius = min / 2 * 0.9;
    var iRadius = min / 2 * 0.65;
    var donutWidth = 75;
	var legendRectSize = 25;
    var legendSpacing = 4;
    var legendWidth = 200;


    var color = d3.scale.category20();

    var svg = d3.select(location)
    	.append('svg')
        .attr('id', svdIdName)
        .attr('width', width)
        .attr('height', height)
        .style('display','block')
        .style('margin','auto')
        .append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    var arc = d3.svg.arc()
    	.outerRadius(oRadius)
  	    .innerRadius(iRadius);

    var pie = d3.layout.pie()
        .value(function(d) { return d.y; })
    	.sort(null);

	var tooltip = d3.select(location)
      	.append('div')
      	.attr('class', 'tooltip-d3')
       	.style("left", ((width-legendWidth)/2) + "px")
  		.style("top", (height/2 + legendWidth/2) + "px");

    tooltip.append('div')
        .attr('class', 'functionLabel');

    tooltip.append('div')
        .attr('class', 'count');

    tooltip.append('div')
        .attr('class', 'percent');


	var total = d3.sum(data.map(function(d) {
  		return d.y;
    }));

    var path = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
        	var percent = Math.round(1000 * d.data.y / total) / 10;
        	return color( percent + "%" + ": " + d.data.x );
        });


  	path.on('mouseover', function(d) {
        var percent = Math.round(1000 * d.data.y / total) / 10;
        tooltip.select('.functionLabel').html(d.data.x);
        tooltip.select('.count').html("Injections: " + d.data.y);
        tooltip.select('.percent').html(percent + '%');
        tooltip.style('display', 'block');
    });

    path.on('mouseout', function() {
        tooltip.style('display', 'none');
    });


 	var legend = svg.selectAll('.legend')
      	.data(color.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
    		var height = legendRectSize + legendSpacing;
            var offset =  height * color.domain().length / 2;
            var horz = -4 * legendRectSize;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
      	});

        legend.append('rect')
      		.attr('width', legendRectSize)
        	.attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color);

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) { return d; });


        svg.append("text")
	        .attr("x", (0))
	        .attr("y", 0 - (min / 2 * 0.95) )
	        .attr("text-anchor", "middle")
	        .style("font-size", "16px")
	        .style("text-decoration", "underline")
	        .text("Functions injected into");

}

function pieChartDonut(allData, location, svdIdName){
		var data = allData[0];
		var axisData = allData[1];
	console.log("Pie chart donut");
		// console.log(data);
		var numGroups = 6;
		if (data.length >= numGroups && Number.isInteger(data[0]['x'])) {
			// Get min and max
			var minVal = data[0]['x'];
			var maxVal = data[data.length - 1]['x'];

			// Get the group size (for all groups except for last group, which could just be some leftovers)
			var groupSize = Math.ceil( (maxVal-minVal) / numGroups);

			var newData = [];

			// Start creating groups
			for (var i=0; i<numGroups; i++) {
				// Accumulator for group
				var groupCount = 0;
				var startValue = i*groupSize;
				var endValue = Math.min( (i+1)*groupSize, maxVal);
				for (var j=startValue; j<endValue; j++) {
					var originalIndex = j;
					groupCount += data[originalIndex]['y'];
				}
				groupDataEntry = {
					'x': startValue + " to " + endValue,
					'y': groupCount,
				};
				newData.push(groupDataEntry);
			}
			data = newData;
		}


    var width = 960;
    var height = 500;
    var radius = Math.min(width, height) / 2;
    var min = Math.min(width, height);
    var oRadius = min / 2 * 0.9;
    var iRadius = min / 2 * 0.8;
    var donutWidth = 75;
    var legendRectSize = 18;
    var legendSpacing = 4;
    var legendWidth = 200;
    var color = d3.scale.linear().domain([0,data.length -1])
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    var svg = d3.select(location)
        .append('svg')
        .attr("id", svdIdName)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    var arc = d3.svg.arc()
        .outerRadius(oRadius)
        .innerRadius(iRadius);

    var pie = d3.layout.pie()
        .value(function(d) { return d.y; })
        .sort(null);

	var tooltip = d3.select(location)
        .append('div')
        .attr('class', 'tooltip-d3')
        .style("left", ((width-legendWidth)/2) + "px")
  		.style("top", (height/2 - legendWidth/4) + "px");

    tooltip.append('div')
        .attr('class', 'functionLabel');

    tooltip.append('div')
      	.attr('class', 'count');

    tooltip.append('div')
      	.attr('class', 'percent');


	var total = d3.sum(data.map(function(d) {
    	return d.y;
    }));

    var path = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
    		var percent = Math.round(1000 * d.data.y / total) / 10;
            return color(i);
    	});


 	path.on('mouseover', function(d) {
        var percent = Math.round(1000 * d.data.y / total) / 10;
        tooltip.select('.functionLabel').html(d.data.x);
        tooltip.select('.count').html("Injections: " + d.data.y);
        tooltip.select('.percent').html(percent + '%');
        tooltip.style('display', 'block');
  	});

	path.on('mouseout', function() {
	    tooltip.style('display', 'none');
    });

 	var legend = svg.selectAll('.legend')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
        	var height = legendRectSize + legendSpacing;
            var offset =  height * (data.length - 1) / 2;
            var horz = -4 * legendRectSize;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', function(d,i){
        	return color(i);
        })
        .style('stroke', color);

    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function(d) {
            var percent = Math.round(1000 * d.data.y / total) / 10;
            return percent + "%: " + d.data.x;
        });


    svg.append("text")
        .attr("x", (0))
        .attr("y", 0 - (min / 2 * 0.95) )
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(axisData.title);

}


function pieChartDonutStacked(allData,location, svdIdName){
	console.log("PIE CHART STACKED");

    var oldData = allData[0];
    var axisData = allData[1];
    //Adjust data to fit pie chart
    var numSlices = 5;
    var sliceSize = Math.floor(oldData[0].length/numSlices);
    var data = [];
    for (var i = 0; i<numSlices; i++){
        var startIndex = i * sliceSize;
        //var endIndex = Math.min(startIndex + sliceSize, oldData[0].length);
        var endIndex = (i == numSlices - 1) ? oldData[0].length - 1 : startIndex + sliceSize - 1;
        var sliceObject = {'x':startIndex + '-' + endIndex,'y':0};
        for (var j = 0; j<oldData.length; j++){
            for (var k = startIndex; k<endIndex; k++){
                sliceObject.y += oldData[j][k].y;
            }
        }
        data.push(sliceObject);
    }

    //var data = allData[0];
    var width = 960;
    var height = 500;
    var radius = Math.min(width, height) / 2;
    var min = Math.min(width, height);
    var oRadius = min / 2 * 0.9;
    var iRadius = min / 2 * 0.8;
    var donutWidth = 75;
 		var legendRectSize = 18;
    var legendSpacing = 4;
    var legendWidth = 200;

    var color = d3.scale.linear().domain([0,data.length -1])
        .interpolate(d3.interpolateHcl)
    		.range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    var svg = d3.select(location)
        .append('svg')
				.attr("id", svdIdName)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    var arc = d3.svg.arc()
        .outerRadius(oRadius)
        .innerRadius(iRadius);

    var pie = d3.layout.pie()
        .value(function(d) { return d.y; })
        .sort(null);

		var tooltip = d3.select(location)
        .append('div')
        .attr('class', 'tooltip-d3')
        .style("left", ((width-legendWidth)/2) + "px")
	  		.style("top", (height/2 - legendWidth/4) + "px");

    tooltip.append('div')
        .attr('class', 'functionLabel');

    tooltip.append('div')
        .attr('class', 'count');

    tooltip.append('div')
        .attr('class', 'percent');


		var total = d3.sum(data.map(function(d) {
        return d.y;
    }));

    var path = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
            var percent = Math.round(1000 * d.data.y / total) / 10;
            return color(i);
        });


		path.on('mouseover', function(d) {
      	console.log("MOUSEOVER");
        var percent = Math.round(1000 * d.data.y / total) / 10;
        tooltip.select('.functionLabel').html(d.data.x);
        tooltip.select('.count').html("Injections: " + d.data.y);
        tooltip.select('.percent').html(percent + '%');
        tooltip.style('display', 'block');
  	});

  	path.on('mouseout', function() {
        tooltip.style('display', 'none');
  	});


		var legend = svg.selectAll('.legend')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
        	var height = legendRectSize + legendSpacing;
            var offset =  height * (data.length - 1) / 2;
            var horz = -4 * legendRectSize;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
    });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', function(d,i){
        	return color(i);
        })
        .style('stroke', color);

    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function(d) {
            var percent = Math.round(1000 * d.data.y / total) / 10;
            return percent + "%: " + d.data.x;
        });


    svg.append("text")
        .attr("x", (0))
        .attr("y", 0 - (min / 2 * 0.95) )
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(axisData.title);

}

function pieChart(allData, svdIdName){
    var axisData = allData[1];
    var data = allData[0];
    var margin = {top: 40, right: 40, bottom: 40, left: 40},
    	width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        radius = Math.min(width, height) / 2;

    var color = d3.scale.linear().domain([1,data.length])
      	.interpolate(d3.interpolateHcl)
      	.range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var labelArc = d3.svg.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.y; });

    var svg = d3.select("#mplplot").append("svg")
    	.attr("id", svdIdName)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + ((height / 2) + margin.top) + ")");

    var g = svg.selectAll(".arc")
      	.data(pie(data))
      	.enter().append("g")
      	.attr("class", "arc");

    g.append("path")
      	.attr("d", arc)
      	.style("fill", function(d, i) { return color(i); });

    g.append("text")
      	.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
      	.attr("dy", ".35em")
      	.text(function(d) { return d.data.x; });

   svg.append("text")
        .attr("x", (0))
        .attr("y", 0 - (height/2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(axisData.title);

    function type(d) {
        d.y = +d.y;
        return d;
    }
}

function stackedPieChart(allData, svdIdName){
	console.log("Stacked pie chart");

    var oldData = allData[0];
    //Adjust data to fit pie chart
    var numSlices = 5;
    var sliceSize = Math.floor(oldData[0].length/numSlices);
    var data = [];
    for (var i = 0; i<numSlices; i++){
        var startIndex = i * sliceSize;
        var endIndex = Math.min(startIndex + sliceSize, oldData[0].length);
        var sliceObject = {'x':startIndex + '-' + endIndex,'y':0};
        for (var j = 0; j<oldData.length; j++){
            for (var k = startIndex; k<endIndex; k++){
                sliceObject.y += oldData[j][k].y;
            }
        }
        sliceObject.y = 10;
        data.push(sliceObject);
    }

    var axisData = allData[1];
    var margin = {top: 40, right: 40, bottom: 40, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        radius = Math.min(width, height) / 2;

    var color = d3.scale.linear().domain([1,data.length])
      	.interpolate(d3.interpolateHcl)
      	.range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var labelArc = d3.svg.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.y; });

    var svg = d3.select("#mplplot").append("svg")
    	.attr("id", svdIdName)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var g = svg.selectAll(".arc")
      	.data(pie(data))
      	.enter().append("g")
      	.attr("class", "arc");

    g.append("path")
  		.attr("d", arc)
      	.style("fill", function(d, i) { return color(i); });

    g.append("text")
      	.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
      	.attr("dy", ".35em")
      	.text(function(d) { return d.data.x; });

    svg.append("text")
        .attr("x", (0))
        .attr("y", 0 - (height/2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(axisData.title);

    function type(d) {
      	d.y = +d.y;
      	return d;
    }
}



//***************COMPARE FUNCTIONS PAGE LOGIC***************//
function clickBindInCompareFunctionPage(){


	// Click binds
	$("#independent-statistics-anchor").click(function(e){
		e.preventDefault();

		if ($("#independent-statistics-main-container").css('display') != 'none'){
			$("#independent-statistics-anchor-up-icon").hide();
			$("#independent-statistics-anchor-down-icon").show();
		} else {
			$("#independent-statistics-anchor-up-icon").show();
			$("#independent-statistics-anchor-down-icon").hide();
		}

		$("#independent-statistics-main-container").slideToggle();

	});

	$("#independent-statistics-anchor-a").click(function(e){
		e.preventDefault();

		if ($("#independent-test-of-proportions-container-function-a").css('display') != 'none'){
			$("#independent-statistics-anchor-a-up-icon").hide();
			$("#independent-statistics-anchor-a-down-icon").show();
		} else {
			$("#independent-statistics-anchor-a-up-icon").show();
			$("#independent-statistics-anchor-a-down-icon").hide();
		}

		$("#independent-test-of-proportions-container-function-a").slideToggle();

	});

	$("#independent-statistics-anchor-b").click(function(e){
		e.preventDefault();

		if ($("#independent-test-of-proportions-container-function-b").css('display') != 'none'){
			$("#independent-statistics-anchor-b-up-icon").hide();
			$("#independent-statistics-anchor-b-down-icon").show();
		} else {
			$("#independent-statistics-anchor-b-up-icon").show();
			$("#independent-statistics-anchor-b-down-icon").hide();
		}

		$("#independent-test-of-proportions-container-function-b").slideToggle();

	});

	$("#comparison-statistics-anchor").click(function(e){
		e.preventDefault();

		if ($("#comparison-statistics-main-container").css('display') != 'none'){
			$("#comparison-statistics-anchor-up-icon").hide();
			$("#comparison-statistics-anchor-down-icon").show();
		} else {
			$("#comparison-statistics-anchor-up-icon").show();
			$("#comparison-statistics-anchor-down-icon").hide();
		}

		$("#comparison-statistics-main-container").slideToggle();

	});


	$("#function-information-anchor").click(function(e){
		e.preventDefault();

		if ($("#function-information-container").css('display') != 'none'){
			$("#function-information-anchor-up-icon").hide();
			$("#function-information-anchor-down-icon").show();
		} else {
			$("#function-information-anchor-up-icon").show();
			$("#function-information-anchor-down-icon").hide();
		}

		$("#function-information-container").slideToggle();

	});

	$("#function-information-a-anchor").click(function(e){
		e.preventDefault();

		if ($("#function-information-a-container").css('display') != 'none'){
			$("#function-information-a-anchor-down-icon").show();
			$("#function-information-a-anchor-up-icon").hide();
		} else {
			$("#function-information-a-anchor-down-icon").hide();
			$("#function-information-a-anchor-up-icon").show();
		}

		$("#function-information-a-container").slideToggle();

	});

	$("#function-information-b-anchor").click(function(e){
		e.preventDefault();

		if ($("#function-information-b-container").css('display') != 'none'){
			$("#function-information-b-anchor-down-icon").show();
			$("#function-information-b-anchor-up-icon").hide();
		} else {
			$("#function-information-b-anchor-down-icon").hide();
			$("#function-information-b-anchor-up-icon").show();
		}

		$("#function-information-b-container").slideToggle();

	});

	var selectedFunctions = {
			"functionA": 0,
			"functionB": 0,
			'analysisColumn': {}
	};

	for (var key in databaseDetails['trials']) {
		var analysis = {
			'useEntry': false,
			'analysisType': -1,
		}
		selectedFunctions['analysisColumn'][key] = analysis;
	}

	$('#compare-function-a-selection-container > li > a').click(function(e) {

		// Add fades here
		//
		$("#compare-functions-function-a").text(this.text);
		// TODO: Use function id's not function names
		selectedFunctions["functionA"] = this.text;
	    e.preventDefault();
	});

	$('#compare-function-b-selection-container > li > a').click(function(e) {

		// Add fades here
		//

		$("#compare-functions-function-b").text(this.text);
		selectedFunctions["functionB"] = this.text;
	    e.preventDefault();
	});

	$('#compare-function-submit-button').click(function(e) {

		// Generate object and send
		if (selectedFunctions["functionA"] != 0 && selectedFunctions["functionB"] != 0){
			compareFunctions(selectedFunctions);
		}

	    e.preventDefault();
	});

	$('#compare-function-analysis-column-selection > div > input').on("click",function(e) {
		console.log("checkbox");
		var selectedColumn = $(this).attr("data-analysis-column");
		var useEntry = selectedFunctions['analysisColumn'][selectedColumn]['useEntry'];
		selectedFunctions['analysisColumn'][selectedColumn]['useEntry'] = !useEntry;
	});

	$('#compare-function-analysis-column-selection > div > div > input').on("click",function(e) {
		console.log("radio");
		var selectedColumn = $(this).parent().parent().find('.analysis-column-checkbox').attr("data-analysis-column");
		console.log(selectedColumn);
		var analysisType = $(this).attr("data-analysis-type");
		selectedFunctions['analysisColumn'][selectedColumn]['analysisType'] = analysisType;
		console.log(selectedFunctions);
	});

}

function updateTrialComparisonPage(comparisonObject, response){

	// If we want to empty the page
	if (response == null){
		$("#independent-statistics-row").slideUp();
	}

	$("#trial-information-row").slideDown();
	$("#comparison-statistics-row").slideDown();

	updateTrialSetInformationSection(response['information']['a'], 'a');
	updateTrialSetInformationSection(response['information']['b'], 'b');

	$("#independent-statistics-anchor-down-icon").hide();
	$("#independent-statistics-anchor-up-icon").show();


	// updateComparisonPageIndependentSection(response, 0, 'a')
	// updateComparisonPageIndependentSection(response, 1, 'b')
	//
	updateTrialSetComparisonSection(response);

}

function updateTrialSetInformationSection(trialInformation, trialLetter) {

	$('#trial-' + trialLetter + '-trial-ids').text(trialInformation['trial']['entries'])
	console.log("Trial information");
	console.log(trialInformation);

	for (column in trialInformation) {
		if (column != 'trial') {
			$('#trial-' + trialLetter + '-' + column + '-avg').text(trialInformation[column]['avg']);
			$('#trial-' + trialLetter + '-' + column + '-std').text(trialInformation[column]['std']);
			$('#trial-' + trialLetter + '-' + column + '-total').text(trialInformation[column]['total']);
		}
	}


	//
	// $('#trial-' + trialLetter + '-iterations-avg').text(trialInformation['iterations_avg'])
	// $('#trial-' + trialLetter + '-iterations-std').text(trialInformation['iterations_std'])
	// $('#trial-' + trialLetter + '-detection-count-total').text(trialInformation['detections_total'])
	// $('#trial-' + trialLetter + '-detection-count-avg').text(trialInformation['detections_avg'])
	// $('#trial-' + trialLetter + '-detection-count-std').text(trialInformation['detections_std'])
	// $('#trial-' + trialLetter + '-crash-count-total').text(trialInformation['crashes_total'])
	// $('#trial-' + trialLetter + '-crash-count-avg').text(trialInformation['crashes_avg'])
	// $('#trial-' + trialLetter + '-crash-count-std').text(trialInformation['crashes_std'])
	// $('#trial-' + trialLetter + '-signal-count-total').text(trialInformation['signals_total'])
	// $('#trial-' + trialLetter + '-signal-count-avg').text(trialInformation['signals_avg'])
	// $('#trial-' + trialLetter + '-signal-count-std').text(trialInformation['signals_std'])

}

function updateTrialSetComparisonSection(trialInformation){

	// injections										=> No tests
	// Iterations										=> T-test, TOST-test
	// Signals, Detections, Crashes => Proportion testing, Chi-Squared Test



	// Clear previous data
	$("#comparison-statistics-anchor-down-icon").hide();
	$("#comparison-statistics-anchor-up-icon").show();
	$("#comparison-statistics-main-container").empty();


	// Place html in comparison div
	for (key in trialInformation['analysisData']) {
		var analysisItem = trialInformation['analysisData'][key];
		if (analysisItem['analysis_type'] == 1) {
			generate_proportion_test_html(analysisItem, "#comparison-statistics-main-container");
		} else if (analysisItem['analysis_type'] == 2) {
			generate_tost_test_html(analysisItem, "#comparison-statistics-main-container");
		} else if (analysisItem['analysis_type'] == 3) {
			generate_tost_test_html(analysisItem, "#comparison-statistics-main-container");
		}

	}

	// generate_tost_test_html(trialInformation['iterations']);
}

function generate_tost_test_html(comparisonItem, insertId) {
	console.log("Generating");

	var tostComparisonHTMLBase = "\
	<div>\
		<h4>\
			<a href=\"\" id=\"comparison-statistics-anchor-{16}\">\
				<span id=\"comparison-statistics-anchor-{17}-down-icon\" class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
        <span id=\"comparison-statistics-anchor-{18}-up-icon\" class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
        {0}\
			</a>\
		</h4>\
		<div style=\"margin-left:40px;\">\
			<div>\
				<h4>\
					<a href=\"\" id=\"comparison-statistics-anchor-{22}-equivalence\">\
						<span class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
						<span class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
						TOST Test for Equivalence\
					</a>\
					<span>(</span>\
					<span class=\"circle\" id=\"independent-statistics-anchor-{20}-circle-tost\"></span>\
					<span id=\"independent-statistics-anchor-{21}-status-tost\"></span>\
					<span>)</span>\
				</h4>\
				<div style=\"display:none;margin-left:40px;\" class=\"comparison-container\" id=\"comparison-container-function-{19}\">\
					<h5>Set #1: {1} = {2}</h5>\
					<h5>Set #1: {3} = {4}</h5>\
					<br />\
					<h5>Set #2: {5} = {6}</h5>\
					<h5>Set #2: {7} = {8}</h5>\
					<br />\
					<h5>Null hypothesis: The absolute value of the difference between the two means is greater than delta (Delta: {13})</h5>\
					<br />\
					<h5>Alternate hypothesis: The absolute value of the difference between the two means is within delta (Delta: {14})</h5>\
					<h5>P-value ({9} Confidence Interval, {10} Significance): {11}</h5>\
					<h5><b>Statistically Significant: {12}</b></h5>\
				</div>\
			</div>\
		</div>\
	</div>";

	var tTestComparisonHTMLBase = "\
	<div>\
		<h4>\
			<a href=\"\" id=\"comparison-statistics-anchor-{16}\">\
				<span id=\"comparison-statistics-anchor-{17}-down-icon\" class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
        <span id=\"comparison-statistics-anchor-{18}-up-icon\" class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
        {0}\
			</a>\
		</h4>\
		<div style=\"margin-left:40px;\">\
			<div>\
				<h4>\
					<a href=\"\" id=\"comparison-statistics-anchor-{23}-difference\">\
						<span class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
						<span class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
						Student's T-Test for Independence\
					</a>\
					<span>(</span>\
					<span class=\"circle\" id=\"independent-statistics-anchor-{20}-circle-t_test\"></span>\
					<span id=\"independent-statistics-anchor-{21}-status-t_test\"></span>\
					<span>)</span>\
				</h4>\
				<div style=\"display:none;margin-left:40px;\" class=\"comparison-container\" id=\"comparison-container-function-{19}\">\
					<h5>Set #1: {1} = {2}</h5>\
					<h5>Set #1: {3} = {4}</h5>\
					<br />\
					<h5>Set #2: {5} = {6}</h5>\
					<h5>Set #2: {7} = {8}</h5>\
					<br />\
					<h5>Null hypothesis: The two samples have identical expected values</h5>\
					<br />\
					<h5>Alternate hypothesis: The two samples have different expected values</h5>\
					<h5>P-value ({9} Confidence Interval, {10} Significance): {11}</h5>\
					<h5><b>Statistically Significant: {12}</b></h5>\
				</div>\
			</div>\
		</div>\
	</div>";


	var htmlString;
	if (comparisonItem['analysis_type'] == 2) {
		htmlString = tostComparisonHTMLBase;
	} else if (comparisonItem['analysis_type'] == 3) {
		htmlString = tTestComparisonHTMLBase;
	}

	var test_type = comparisonItem['analysis_type_string']

	htmlString = htmlString.replace("{0}", comparisonItem["type"]);
	htmlString = htmlString.replace("{1}", comparisonItem["p1"]["avg"]["title"]);
	htmlString = htmlString.replace("{2}", comparisonItem["p1"]["avg"]["value"]);
	htmlString = htmlString.replace("{3}", comparisonItem["p1"]["std"]["title"]);
	htmlString = htmlString.replace("{4}", comparisonItem["p1"]["std"]["value"]);
	htmlString = htmlString.replace("{5}", comparisonItem["p2"]["avg"]["title"]);
	htmlString = htmlString.replace("{6}", comparisonItem["p2"]["avg"]["value"]);
	htmlString = htmlString.replace("{7}", comparisonItem["p2"]["std"]["title"]);
	htmlString = htmlString.replace("{8}", comparisonItem["p2"]["std"]["value"]);

	htmlString = htmlString.replace("{9}", confidenceValue);
	htmlString = htmlString.replace("{10}", (1 - ( confidenceValue / 100.0 )).toFixed(2) );
	htmlString = htmlString.replace("{11}", comparisonItem["p_value"]);
	htmlString = htmlString.replace("{12}", comparisonItem["success"]);
	htmlString = htmlString.replace("{13}", comparisonItem["delta"]);
	htmlString = htmlString.replace("{14}", comparisonItem["delta"]);

	htmlString = htmlString.replace("{16}", comparisonItem['type']);
	htmlString = htmlString.replace("{17}", comparisonItem['type']);
	htmlString = htmlString.replace("{18}", comparisonItem['type']);
	htmlString = htmlString.replace("{19}", comparisonItem['type']);
	htmlString = htmlString.replace("{20}", comparisonItem['type']);
	htmlString = htmlString.replace("{21}", comparisonItem['type']);
	htmlString = htmlString.replace("{22}", comparisonItem['type']);
	htmlString = htmlString.replace("{23}", comparisonItem['type']);






	$(insertId).append(htmlString);

	if (comparisonItem["success"] == "True"){
		$("#independent-statistics-anchor-" + comparisonItem['type'] + "-status-" + test_type).text("Statistically significant");
		$("#independent-statistics-anchor-" + comparisonItem['type'] + "-circle-" + test_type).addClass("success-indicator");
	} else {
		$("#independent-statistics-anchor-" + comparisonItem['type'] + "-status-" + test_type).text("Not significant");
		$("#independent-statistics-anchor-" + comparisonItem['type'] + "-circle-" + test_type).addClass("fail-indicator");
	}


	$("#comparison-statistics-anchor-" + comparisonItem['type']).click(function(e) {
		var targetContainer = $(this).parent().parent().find(".comparison-container");

		if (targetContainer.css('display') != 'none'){
			$(this).find(".glyphicon-chevron-up").hide();
			$(this).find(".glyphicon-chevron-down").show();
		} else {
			$(this).find(".glyphicon-chevron-up").show();
			$(this).find(".glyphicon-chevron-down").hide();
		}

		targetContainer.slideToggle();
		e.preventDefault();
	});

	$("#comparison-statistics-anchor-" + comparisonItem['type'] + '-equivalence').click(function(e) {
		var targetContainer = $(this).parent().parent().find(".comparison-container");

		if (targetContainer.css('display') != 'none'){
			$(this).find(".glyphicon-chevron-up").hide();
			$(this).find(".glyphicon-chevron-down").show();
		} else {
			$(this).find(".glyphicon-chevron-up").show();
			$(this).find(".glyphicon-chevron-down").hide();
		}

		targetContainer.slideToggle();
		e.preventDefault();
	});

	$("#comparison-statistics-anchor-" + comparisonItem['type'] + '-difference').click(function(e) {
		var targetContainer = $(this).parent().parent().find(".comparison-container");

		if (targetContainer.css('display') != 'none'){
			$(this).find(".glyphicon-chevron-up").hide();
			$(this).find(".glyphicon-chevron-down").show();
		} else {
			$(this).find(".glyphicon-chevron-up").show();
			$(this).find(".glyphicon-chevron-down").hide();
		}

		targetContainer.slideToggle();
		e.preventDefault();
	});

}

function generate_proportion_test_html(comparisonItem, insertId) {
	console.log("Comparison item:");
	console.log(comparisonItem);



	var comparisonHTMLBase = "\
	<div>\
		<h4>\
			<a href=\"\" id=\"comparison-statistics-anchor-{16}\">\
				<span id=\"comparison-statistics-anchor-{17}-down-icon\" class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
        <span id=\"comparison-statistics-anchor-{18}-up-icon\" class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
        {0}\
			</a>\
		</h4>\
		<div style=\"margin-left:40px;\">\
			<div>\
				<h4>\
					<a href=\"\"  id=\"comparison-statistics-anchor-{22}-difference\">\
						<span class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
						<span class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
						Test for Difference of two Proportions\
					</a>\
					<span>(</span>\
					<span class=\"circle\" id=\"independent-statistics-anchor-{20}-circle\"></span>\
					<span id=\"independent-statistics-anchor-{21}-status\"></span>\
					<span>)</span>\
				</h4>\
				<div style=\"display:none;margin-left:40px;\" class=\"comparison-container\" id=\"comparison-container-function-{19}\">\
					<h5>P<sub>1</sub> = {1} / {2} = {3} / {4}</h5>\
					<h5>P<sub>1</sub> = {5}</h5>\
					<br />\
					<h5>P<sub>2</sub> = {6} / {7} = {8} / {9}</h5>\
					<h5>P<sub>2</sub> = {10}</h5>\
					<br />\
					<h5>Null hypothesis: P<sub>1</sub> >= P<sub>2</sub>, Alternate hypothesis: P<sub>1</sub> < P<sub>2</sub></h5>\
					<h5>Z-value: {11}\
					<h5>P-value ({12} Confidence Interval, {13} Significance): {14}</h5>\
					<h5><b>Statistically Significant: {15}\
				</div>\
			</div>\
		</div>\
	</div>";

	var comparisonErrorHTMLBase = "\
	<div>\
		<h4>\
			<a href=\"\" id=\"comparison-statistics-anchor-{16}\">\
				<span id=\"comparison-statistics-anchor-{17}-down-icon\" class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
        <span id=\"comparison-statistics-anchor-{18}-up-icon\" class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
        {0}\
			</a>\
		</h4>\
		<div style=\"margin-left:40px;\">\
			<div>\
				<h4>\
					<a href=\"\"  id=\"comparison-statistics-anchor-{22}-difference\">\
						<span class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
						<span class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
						Test for Difference of two Proportions\
					</a>\
					<span>(</span>\
					<span class=\"circle\" id=\"independent-statistics-anchor-{20}-circle\"></span>\
					<span id=\"independent-statistics-anchor-{21}-status\"></span>\
					<span>)</span>\
				</h4>\
				<div style=\"display:none;margin-left:40px;\" class=\"comparison-container\" id=\"comparison-container-function-{19}\">\
					<h5>Error: {23}</h5>\
					<br />\
				</div>\
			</div>\
		</div>\
	</div>";



  	// var comparisonItem = trialInformation['detections'];

  	if ($("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").length){

			$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").removeClass();
			$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").addClass("circle");

  	}

		var htmlString;

		if ("error" in comparisonItem) {
			print("Error");
			htmlString = comparisonErrorHTMLBase;

			htmlString = htmlString.replace("{0}", comparisonItem["type"]);

			htmlString = htmlString.replace("{15}", comparisonItem["success"]);

			htmlString = htmlString.replace("{16}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{17}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{18}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{19}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{20}", comparisonItem['type']);
			htmlString = htmlString.replace("{21}", comparisonItem['type']);
			htmlString = htmlString.replace("{22}", comparisonItem['type']);
			htmlString = htmlString.replace("{23}", comparisonItem['error']);

		} else {
			htmlString = comparisonHTMLBase;

			htmlString = htmlString.replace("{0}", comparisonItem["type"]);
			htmlString = htmlString.replace("{1}", comparisonItem["p1"]["numerator"]["title"]);
			htmlString = htmlString.replace("{2}", comparisonItem["p1"]["denominator"]["title"]);
			htmlString = htmlString.replace("{3}", comparisonItem["p1"]["numerator"]["value"]);
			htmlString = htmlString.replace("{4}", comparisonItem["p1"]["denominator"]["value"]);
			htmlString = htmlString.replace("{5}", comparisonItem["p1"]["value"]);

			htmlString = htmlString.replace("{6}", comparisonItem["p2"]["numerator"]["title"]);
			htmlString = htmlString.replace("{7}", comparisonItem["p2"]["denominator"]["title"]);
			htmlString = htmlString.replace("{8}", comparisonItem["p2"]["numerator"]["value"]);
			htmlString = htmlString.replace("{9}", comparisonItem["p2"]["denominator"]["value"]);
			htmlString = htmlString.replace("{10}", comparisonItem["p2"]["value"]);

			htmlString = htmlString.replace("{11}", comparisonItem["z_value"]);
			htmlString = htmlString.replace("{12}", confidenceValue);
			htmlString = htmlString.replace("{13}", (1 - ( confidenceValue / 100.0 )).toFixed(2) );
			htmlString = htmlString.replace("{14}", comparisonItem["p_value"]);


			htmlString = htmlString.replace("{15}", comparisonItem["success"]);

			htmlString = htmlString.replace("{16}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{17}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{18}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{19}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{20}", comparisonItem['type']);
			htmlString = htmlString.replace("{21}", comparisonItem['type']);
			htmlString = htmlString.replace("{22}", comparisonItem['type']);
			htmlString = htmlString.replace("{23}", comparisonItem['type']);
		}



		$(insertId).append(htmlString);


		if (comparisonItem["success"] == "True"){
			$("#independent-statistics-anchor-" + comparisonItem["type"] + "-status").text("Statistically significant");
    	$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").addClass("success-indicator");
		} else {
			$("#independent-statistics-anchor-" + comparisonItem["type"] + "-status").text("Unable to determine significance");
    	$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").addClass("fail-indicator");
		}



  	$("#comparison-statistics-anchor-" + comparisonItem['type']).click(function(e) {
  		//$("#comparison-container-function-" + comparisonItem['type']).slideToggle();
  		var targetContainer = $(this).parent().parent().find(".comparison-container");

  		if (targetContainer.css('display') != 'none'){
  			$(this).find(".glyphicon-chevron-up").hide();
				$(this).find(".glyphicon-chevron-down").show();
			} else {
				$(this).find(".glyphicon-chevron-up").show();
				$(this).find(".glyphicon-chevron-down").hide();
			}

  		targetContainer.slideToggle();
	    e.preventDefault();
		});

		$("#comparison-statistics-anchor-" + comparisonItem['type'] + '-equivalence').click(function(e) {
			var targetContainer = $(this).parent().parent().find(".comparison-container");

			if (targetContainer.css('display') != 'none'){
				$(this).find(".glyphicon-chevron-up").hide();
				$(this).find(".glyphicon-chevron-down").show();
			} else {
				$(this).find(".glyphicon-chevron-up").show();
				$(this).find(".glyphicon-chevron-down").hide();
			}

			targetContainer.slideToggle();
			e.preventDefault();
		});

		$("#comparison-statistics-anchor-" + comparisonItem['type'] + '-difference').click(function(e) {
			var targetContainer = $(this).parent().parent().find(".comparison-container");

			if (targetContainer.css('display') != 'none'){
				$(this).find(".glyphicon-chevron-up").hide();
				$(this).find(".glyphicon-chevron-down").show();
			} else {
				$(this).find(".glyphicon-chevron-up").show();
				$(this).find(".glyphicon-chevron-down").hide();
			}

			targetContainer.slideToggle();
			e.preventDefault();
		});

}



function compareFunctions(comparisonObject){

	// Empty previous data
	//$("#mplplot").empty();

	$.ajax({
	    url: '/generateFunctionComparison',
	    data: JSON.stringify(comparisonObject),
	    contentType: 'application/json;charset=UTF-8',
	    type: 'POST',
	    success: function(response) {
	    	console.log(JSON.parse(response));
	    	var parsedResponse = JSON.parse(response);
	    	updateComparisonPage(comparisonObject, parsedResponse)

	    },
	    error: function(error) {
		    console.log(error);
	    }
	});
}

function updateComparisonPage(comparisonObject, response){



	// If we want to empty the page
	if (response == null){
		$("#independent-statistics-row").slideUp();
	}

	var functionAName = comparisonObject["functionA"]
	var functionBName = comparisonObject["functionB"]

	$("#function-information-row").slideDown();
	$("#independent-statistics-row").slideDown();
	$("#comparison-statistics-row").slideDown();

	$(".function-a-name").text(functionAName);
	$(".function-b-name").text(functionBName)

	updateFunctionInformationSection(response);

	$("#independent-statistics-anchor-down-icon").hide();
	$("#independent-statistics-anchor-up-icon").show();

	updateComparisonPageIndependentSection(response, 0, 'a')
	updateComparisonPageIndependentSection(response, 1, 'b')

	updateComparisonPageComparisonSection(response);

}

function updateFunctionSetInformationSection(trialInformation, trialLetter) {

	$('#function-' + trialLetter + '-trial-ids').text(trialInformation['trial']['entries'])
	console.log("Trial information");
	console.log(trialInformation);

	for (column in trialInformation) {
		if (column != 'trial') {
			$('#function-' + trialLetter + '-' + column + '-avg').text(trialInformation[column]['avg']);
			$('#function-' + trialLetter + '-' + column + '-std').text(trialInformation[column]['std']);
			$('#function-' + trialLetter + '-' + column + '-total').text(trialInformation[column]['total']);
		}
	}
}

function updateFunctionInformationSection(response){
	var functionInformation = response[5];

	updateFunctionSetInformationSection(functionInformation['information']['a'], 'a');
	updateFunctionSetInformationSection(functionInformation['information']['b'], 'b');
	//
	// $('#function-' + trialLetter + '-trial-ids').text(trialInformation['trial']['entries'])
	// console.log("Trial information");
	// console.log(trialInformation);
	//
	// for (column in trialInformation) {
	// 	if (column != 'trial') {
	// 		$('#function-' + trialLetter + '-' + column + '-avg').text(trialInformation[column]['avg']);
	// 		$('#function-' + trialLetter + '-' + column + '-std').text(trialInformation[column]['std']);
	// 		$('#function-' + trialLetter + '-' + column + '-total').text(trialInformation[column]['total']);
	// 	}
	// }
	//
	// $("#function-a-injection-count").text(functionInformation[0]["injection_count"]);
	// $("#function-b-injection-count").text(functionInformation[1]["injection_count"]);
	//
	// $("#function-a-trials").text(functionInformation[0]["trial_list"]);
	// $("#function-b-trials").text(functionInformation[1]["trial_list"]);
	//
	// $("#function-a-detection-count").text(functionInformation[0]["detection_count"]);
	// $("#function-b-detection-count").text(functionInformation[1]["detection_count"]);
	//
	// $("#function-a-crash-count").text(functionInformation[0]["crash_count"]);
	// $("#function-b-crash-count").text(functionInformation[1]["crash_count"]);
	//


}

function updateComparisonPageIndependentSection(response, functionId, functionLetter){

	$("#independent-test-of-proportions-container-function-" + functionLetter)
		.empty()
		.hide()
		.append("<span id=\"function-" + functionLetter + "-trial-status\"></span>");

	$("#independent-statistics-anchor-" + functionLetter + "-down-icon").show();
	$("#independent-statistics-anchor-" + functionLetter + "-up-icon").hide();

	$("#independent-statistics-anchor-" + functionLetter + "-circle").removeClass();
	$("#independent-statistics-anchor-" + functionLetter + "-circle").addClass("circle");


	if (response[4]["statisticalUseAllTrials"]){
		$("#function-" + functionLetter + "-trial-status").html("<b>Using all trials</b>");
	} else {
		var inputString = "<b>Using trials in range [{0}, {1}]</b>"
		inputString = inputString.replace("{0}", response[4]["statisticalStartTrial"]);
		inputString = inputString.replace("{1}", response[4]["statisticalEndTrial"]);
		$("#function-" + functionLetter + "-trial-status").html(inputString);
	}

	var injectionTypeHTMLCodeBase = "<h3>{0}</h3>\
                            <h5>P<sub>1</sub> = Injections of this type / Total Injections = {1} / {2}</h5>\
                            <h5>P<sub>1</sub> = {3}</h5>\
                            <br />\
                            <h5>P<sub>2</sub> = Sites of this type / Total sites = {4} / {5}</h5>\
                            <h5>P<sub>2</sub> = {6}</h5>\
                            <br />\
                            <h5>Null hypothesis: P<sub>1</sub> = P<sub>2</sub>, Alternate hypothesis: P<sub>1</sub> != P<sub>2</sub></h5>\
                            <h5>Z-value: {7}\
                            <h5>P-value ({8}% Confidence Interval, {9} Significance): {10}</h5>\
                            <h5><b>Statistically Significant: \
                            {11}\
                            </b>\
                            </h5>"


    var successfulCount = 0;

		console.log("Response:");
		console.log(response);
    for (var i = 0; i < response[functionId].length; i++){
    	var item = response[functionId][i];
    	var injectionTypeHTMLCode = injectionTypeHTMLCodeBase;
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{0}", item['type']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{1}", item['numTypeInjections']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{2}", item['numTotalInjections']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{3}", item['p1']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{4}", item['numTypeSites']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{5}", item['numTotalSites']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{6}", item['p2']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{7}", item['z_value']);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{8}", confidenceValue);
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{9}", (1 - ( confidenceValue / 100.0 )).toFixed(2)  );
    	injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{10}", item['p_value']);
    	if (item['success'] == "True"){
    		injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{11}", '<span style=\"color:green\">True</span>');
    		successfulCount++;
    	} else {
    		injectionTypeHTMLCode = injectionTypeHTMLCode.replace("{11}", '<span style=\"color:red\">False</span>');
    	}



    	$("#independent-test-of-proportions-container-function-" + functionLetter).append(injectionTypeHTMLCode);


    }

    // Status indicator
    var statusText = "{0}/{1} injection types significant";
    statusText = statusText.replace("{0}", successfulCount);
    statusText = statusText.replace("{1}", response[functionId].length);

    $("#independent-statistics-anchor-" + functionLetter + "-status").text(statusText);

    if (successfulCount == 0){
    	$("#independent-statistics-anchor-" + functionLetter + "-circle").addClass("fail-indicator");
    } else if (successfulCount == response[functionId].length){
    	$("#independent-statistics-anchor-" + functionLetter + "-circle").addClass("success-indicator");
    } else {
    	$("#independent-statistics-anchor-" + functionLetter + "-circle").addClass("intermediate-indicator");
    }
}

function updateComparisonPageComparisonSection(response){

	// Clear previous data
	$("#comparison-statistics-anchor-down-icon").hide();
	$("#comparison-statistics-anchor-up-icon").show();
	$("#comparison-statistics-main-container").empty();


	// Place html in comparison div
	var comparisonData = response[5];

	// Place html in comparison div
	for (key in comparisonData['analysisData']) {
		var analysisItem = comparisonData['analysisData'][key];
		if (analysisItem['analysis_type'] == 1) {
			generate_proportion_test_html(analysisItem, "#comparison-statistics-main-container");
		} else if (analysisItem['analysis_type'] == 2) {
			generate_tost_test_html(analysisItem, "#comparison-statistics-main-container");
		} else if (analysisItem['analysis_type'] == 3) {
			generate_tost_test_html(analysisItem, "#comparison-statistics-main-container");
		}

	}

	var comparisonHTMLBase = "<div>\
                            <h4><a href=\"\" id=\"comparison-statistics-anchor-{16}\">\
									<span id=\"comparison-statistics-anchor-{17}-down-icon\" class=\"glyphicon glyphicon-chevron-down\" style=\"color: #333;font-size:15px;\" aria-hidden=\"true\"></span>\
                                    <span id=\"comparison-statistics-anchor-{18}-up-icon\" class=\"glyphicon glyphicon-chevron-up\" style=\"color: #333;display:none;font-size:15px;\" aria-hidden=\"true\"></span>\
                                    {0}</a>\
                                    <span>(</span>\
	                                <span class=\"circle\" id=\"independent-statistics-anchor-{20}-circle\"></span>\
	                                <span id=\"independent-statistics-anchor-{21}-status\"></span>\
	                                <span>)</span>\
                            </h4>\
                            <div style=\"display:none;margin-left:40px;\" class=\"comparison-container\" id=\"comparison-container-function-{19}\">\
                                <h5>P<sub>1</sub> = {1} / {2} = {3} / {4}</h5>\
                                <h5>P<sub>1</sub> = {5}</h5>\
\
                                <br />\
\
                                <h5>P<sub>2</sub> = {6} / {7} = {8} / {9}</h5>\
                                <h5>P<sub>2</sub> = {10}</h5>\
\
                                <br />\
                                <h5>Null hypothesis: P<sub>1</sub> >= P<sub>2</sub>, Alternate hypothesis: P<sub>1</sub> < P<sub>2</sub></h5>\
                                <h5>Z-value: {11}\
                                <h5>P-value ({12} Confidence Interval, {13} Significance): {14}</h5>\
                                <h5><b>Statistically Significant: {15}\
\
                            </div>\
                        </div>";

    for (var i = 0; i < comparisonData.length; i++){
    	var comparisonItem = comparisonData[i];

    	if ($("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").length){

				$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").removeClass();
				$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").addClass("circle");

	  	}


	  	var htmlString = comparisonHTMLBase;
	  	htmlString = htmlString.replace("{0}", comparisonItem["type"]);
			htmlString = htmlString.replace("{1}", comparisonItem["p1"]["numerator"]["title"]);
			htmlString = htmlString.replace("{2}", comparisonItem["p1"]["denominator"]["title"]);
			htmlString = htmlString.replace("{3}", comparisonItem["p1"]["numerator"]["value"]);
			htmlString = htmlString.replace("{4}", comparisonItem["p1"]["denominator"]["value"]);
			htmlString = htmlString.replace("{5}", comparisonItem["p1"]["value"]);

			htmlString = htmlString.replace("{6}", comparisonItem["p2"]["numerator"]["title"]);
			htmlString = htmlString.replace("{7}", comparisonItem["p2"]["denominator"]["title"]);
			htmlString = htmlString.replace("{8}", comparisonItem["p2"]["numerator"]["value"]);
			htmlString = htmlString.replace("{9}", comparisonItem["p2"]["denominator"]["value"]);
			htmlString = htmlString.replace("{10}", comparisonItem["p2"]["value"]);

			htmlString = htmlString.replace("{11}", comparisonItem["z_value"]);
			htmlString = htmlString.replace("{12}", confidenceValue);
			htmlString = htmlString.replace("{13}", (1 - ( confidenceValue / 100.0 )).toFixed(2) );
			htmlString = htmlString.replace("{14}", comparisonItem["p_value"]);


			htmlString = htmlString.replace("{15}", comparisonItem["success"]);

			htmlString = htmlString.replace("{16}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{17}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{18}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{19}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{20}", comparisonItem['type']);
	  	htmlString = htmlString.replace("{21}", comparisonItem['type']);

			$("#comparison-statistics-main-container").append(htmlString);


			if (comparisonItem["success"] == "True"){
				$("#independent-statistics-anchor-" + comparisonItem["type"] + "-status").text("Statistically significant");
	    	$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").addClass("success-indicator");
			} else {
				$("#independent-statistics-anchor-" + comparisonItem["type"] + "-status").text("Unable to determine significance");
	    	$("#independent-statistics-anchor-" + comparisonItem["type"] + "-circle").addClass("fail-indicator");
			}

    }

    for (var i = 0; i < comparisonData.length; i++){
    	var comparisonItem = comparisonData[i];
    	$("#comparison-statistics-anchor-" + comparisonItem['type']).click(function(e) {
	  		//$("#comparison-container-function-" + comparisonItem['type']).slideToggle();
	  		var targetContainer = $(this).parent().parent().find(".comparison-container");

	  		if (targetContainer.css('display') != 'none'){
	  			$(this).find(".glyphicon-chevron-up").hide();
					$(this).find(".glyphicon-chevron-down").show();
				} else {
					$(this).find(".glyphicon-chevron-up").show();
					$(this).find(".glyphicon-chevron-down").hide();
				}

	  		targetContainer.slideToggle();
		    e.preventDefault();
			});
    }

}

//***************GRAPH CREATION SETUP***************//
function setupGraphCreation(isFunctionPage){
	var selectedGraph = {
			"focus": 0,
			"detail": 0,
			"type": 0,
			"region": 0,
			"regionStart": 0,
			"regionEnd": 0,
	        "constraintArray":[],
	};

	var constraintItem = {
	        "type": 0,
	        "value": 0,
	        "table":0,
	        "column": 0,
	};

	var injectionDetail = [
	    "Type of injected functions",
	    "Bit locations",
	    "Injected Functions",
	    "Injection type per function",
	    "Injections mapped to line numbers",
	];

	var signalDetail = [
	    "Unexepected Termination",
	];

	var detectionDetail = [
	    "Number of trials with detection",
	    "Detected injection bit location",
	    "Detection latency",
	];

	$('#graph-focus > li > a').click(function(e) {
		populateDetailDropdown(this.text,e);
		$("#graph-detail-dropdown").fadeIn();
		$("#graph-type-dropdown").fadeOut();
		$("#graph-code-region-dropdown").fadeOut();
		$("#line-number-selection").fadeOut();
		$("#create-graph-button").fadeOut();
		$("#graph-focus-text").text(this.text);
		$("#graph-detail-text").text("Focus");
		$("#save-graph-button").fadeOut();
		$("#save-graph-svg-button").fadeOut();
		$("#save-graph-json-button").fadeOut();
	    $("#add-constraint-button").fadeOut();
	    e.preventDefault();
	});

	$('#graph-detail').on('click', 'li a', function(e) {
		determineDetail(this.text);
		$("#graph-detail-text").text(this.text);
		$("#graph-type-text").text("Graph Type");
		$("#graph-type-dropdown").fadeIn();
		$("#graph-code-region-dropdown").fadeOut();
		$("#line-number-selection").fadeOut();
		$("#create-graph-button").fadeOut();
		$("#save-graph-button").fadeOut();
		$("#save-graph-svg-button").fadeOut();
		$("#save-graph-json-button").fadeOut();
	    $("#add-constraint-button").fadeOut();
		e.preventDefault();
	});
	$('#graph-type > li > a').click(function(e) {
		if (isFunctionPage){
			$("#graph-code-region-text").text(functionName + ' - Entire Function');
	    	selectedGraph['region'] = functionName;
		} else {
			$("#graph-code-region-text").text('Entire Application');
    		selectedGraph['region'] = "";
		}

		$("#graph-code-region-dropdown").fadeIn();
		determineType(this.text);
		$("#graph-type-text").text(this.text);
	    $("#add-constraint-button").fadeIn();
			$("#save-graph-button").fadeOut();
			$("#save-graph-svg-button").fadeOut();
			$("#save-graph-json-button").fadeOut();
		$("#line-number-selection").fadeOut();
		$("#create-graph-button").fadeIn();
		e.preventDefault();
	});

	$('#graph-code-region > li > a').click(function(e) {
		//$("#graph-code-region-dropdown").fadeIn();
	    var codeRegion = $(this).attr("data-region-type");
	    var codeRegionFunction = $(this).attr("data-function-name");

	    selectedGraph['regionStart'] = "";
	    selectedGraph['regionEnd'] = "";

	    if (codeRegion == 0){
	        selectedGraph['region'] = "";
	        $("#line-number-selection").fadeOut();
	    } else if (codeRegion == 1){
	        selectedGraph['region'] = codeRegionFunction;
	        $("#line-number-selection").fadeOut();
	    } else if (codeRegion == 2){
	        selectedGraph['region'] = codeRegionFunction;
	        $("#graph-code-region-start").val("");
	        $("#graph-code-region-end").val("");
	        $("#line-number-selection").fadeIn();
	    }

	    $("#create-graph-button").fadeIn();
		$("#graph-code-region-text").text(this.text);
		$("#save-graph-button").fadeOut();
		$("#save-graph-svg-button").fadeOut();
		$("#save-graph-json-button").fadeOut();
		e.preventDefault();
	});


	$("#add-constraint-button").click(function(e){
	    //Create a new constraint item
		var constraintItemNew = jQuery.extend(true, {}, constraintItem)
	    selectedGraph['constraintArray'].push(constraintItemNew);
	    var constraintId = selectedGraph['constraintArray'].length - 1;

	    //Database info string
	    var databaseInfo = "";
	    for (var table in currentSettings.customConstraints){
	        if (currentSettings.customConstraints[table].length > 0){
	            databaseInfo += '<li role="presentation" class="dropdown-header">' + table + '</li>';
	            for (var i=0; i<currentSettings.customConstraints[table].length; i++){
	                var columnName = currentSettings.customConstraints[table][i];
	                databaseInfo += '<li role="presentation"><a role="menuitem" tabindex="-1" data-table-name="' + table + '" data-col-name="' + columnName + '" href="#">' + columnName + " - " + databaseDetails[table][columnName] + '</a></li>';
	            }
	        }
	    }
	    $(".graph-submit-row").before(constraintHTMLItem.replace("{0}", constraintId).replace("{1}", databaseInfo));

	    $(".remove-constraint-button").on("click",function(e){
	        var constraintId = $(this).parents(".constraint-container").attr("data-constraint-id");
	        $(this).parents(".constraint-container").parent().remove();
	        selectedGraph['constraintArray'].splice(constraintId,1);

	        //Change data-constraint-id of all constraints that follow
	        var constraintsToChange = $(".constraint-container").filter(function() {
	            var oldId = $(this).attr("data-constraint-id");
	            if (oldId > constraintId){
	                $(this).attr("data-constraint-id", oldId - 1);
	            }
	        });
	    });

	    $('.constraint-table-selection > li > a').on("click",function(e) {
	        var constraintId = $(this).parents(".constraint-container").attr("data-constraint-id");
	        var selectedTable = $(this).attr("data-table-name");
	        var selectedColumn = $(this).attr("data-col-name");
	        selectedGraph['constraintArray'][constraintId]['table'] = selectedTable;
	        selectedGraph['constraintArray'][constraintId]['column'] = selectedColumn
	        $(this).parents(".constraint-container").find(".graph-constraint-type-selection-dropdown").fadeIn();
		    $(this).parents(".constraint-container").find(".constraint-table-selection-text").text(this.text);
		    e.preventDefault();
	    });

	    $('.constraint-type-selection > li > a').on("click",function(e) {
	        var constraintId = $(this).parents(".constraint-container").attr("data-constraint-id");
		    var constraintType = determineConstraintType(this.text);
	        selectedGraph['constraintArray'][constraintId]['type'] = String(constraintType);
	        $(this).parents(".constraint-container").find(".constraint-selection-container").fadeIn();
	        $(this).parents(".constraint-container").find(".constraint-type-selection-text").text(this.text);
		    e.preventDefault();
	    });

		e.preventDefault();
	});


	var constraintHTMLItem = '<div class="row" style="margin-top:5px;">\
	                        <div class="btn-toolbar constraint-container" data-constraint-id="{0}">\
	                            <div class="btn-group">\
	                                <div class="dropdown graph-constraint-selection-dropdown">\
	                                    <button class="btn btn-primary dropdown-toggle constraint-table-selection-button" type="button" data-toggle="dropdown">\
	                                    <span class="constraint-table-selection-text">Select Constraint Column (Optional)</span>\
	                                    <span class="caret"></span>\
	                                    </button>\
	                                    <ul class="dropdown-menu constraint-table-selection" role="menu" aria-labelledby="menu1">\
	                                    {1}\
	                                    </ul>\
	                                </div>\
	                            </div>\
	                            <div class="btn-group">\
	                                <div class="dropdown graph-constraint-type-selection-dropdown" style="display:none;">\
	                                    <button class="btn btn-primary dropdown-toggle constraint-type-selection-button" type="button" data-toggle="dropdown">\
	                                    <span class="constraint-type-selection-text">Constraint</span>\
	                                    <span class="caret"></span>\
	                                    </button>\
	                                    <ul class="dropdown-menu constraint-type-selection" role="menu" aria-labelledby="menu1">\
	                                        <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Equals</a></li>\
	                                        <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Not Equal To</a></li>\
	                                        <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Greater Than</a></li>\
	                                        <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Greater Than Or Equal To</a></li>\
	                                        <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Less Than</a></li>\
	                                        <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Less Than Or Equal To</a></li>\
	                                    </ul>\
	                                </div>\
	                            </div>\
	                            <div class="constraint-selection-container" style="display:none;">\
	                                <div class="input-group">\
	                                    <input type="text" class="form-control constraint-selection-input" placeholder="Constraint">\
	                                </div>\
	                            </div>\
	                            <div class="btn-group">\
	                                <div class="remove-constraint-button">\
	                                    <button type="button" class="btn btn-info">Remove constraint</button>\
	                                </div>\
	                            </div>\
	                        </div>\
	                    </div>';

	$("#create-graph-button").click(function(e){

	    // Check if "InjectionMappedToLine" graph, and one function not selected
	    if (selectedGraph['detail'] == 5 && selectedGraph['focus'] == 1 && selectedGraph['type'] == 1 && selectedGraph['region'] == ""){
    		alert("For this graph type, please select a specific function");
    		return;
	    }

			if (selectedGraph['detail'] == INJECTION_TYPE_FUNCTION && selectedGraph['type'] == CHART_PIE) {
				alert("This type of graph cannot be represented as a pie chart. 'Type of injected function' is similar and can be represented via a pie chart.");
				return;
			}

	    var endFunction = false;
	    // Fill out constraint details
	    $(".constraint-container").each(function() {
	            var constraintId = $(this).attr("data-constraint-id");
	            var constraintValue = $(this).find(".constraint-selection-input").val();
	            if (constraintValue.trim() == ""){
	                alert("Input is missing data");
	                endFunction = true;
	                return;
	            }
	            selectedGraph['constraintArray'][constraintId]['value'] = constraintValue;
	    });

	    if (endFunction){
	        return;
	    }
		// Get line numbers
		if (selectedGraph['region'] != ""){
	        var regionStart = $("#graph-code-region-start").val().trim();
	        var regionEnd = $("#graph-code-region-end").val().trim();
	        if (regionStart == "" && regionEnd == ""){
	            selectedGraph['regionStart'] = "";
	            selectedGraph['regionEnd'] = "";
	        } else {
	    	    selectedGraph['regionStart'] = parseInt($("#graph-code-region-start").val());
		        selectedGraph['regionEnd'] = parseInt($("#graph-code-region-end").val());
	        }
	    }
	    //$("#custom-graph-svd").empty();
	    //$("#custom-graph-svd").remove()
		createGraph(selectedGraph, "custom-graph-svd");
		$("#save-graph-button").fadeIn();
		$("#save-graph-svg-button").fadeIn();
		$("#save-graph-json-button").fadeIn();
    e.preventDefault();
	});




	function determineConstraintType(val){
	    if (val == "Equals"){
	        return 1;
	    } else if (val == "Not Equal To"){
	        return 2;
	    } else if (val == "Greater Than"){
	        return 3;
	    } else if (val == "Greater Than Or Equal To"){
	        return 4;
	    } else if (val == "Less Than"){
	        return 5;
	    } else if (val == "Less Than Or Equal To"){
	        return 6;
	    } else {
	        return 0;
	    }
	}


	function populateDetailDropdown(val, e) {
	    if ( val === "Injections" ) {
			selectedGraph['focus'] = FOCUS_INJECTIONS;
	        $('#graph-detail').empty('');
	        for ( var i in injectionDetail ) {
	            $('#graph-detail').append("<li><a href='#'>" + injectionDetail[i] + "</a></li>");
	        }
	    } else if (val == "Signals"){
			selectedGraph['focus'] = FOCUS_SIGNALS;
	        $('#graph-detail').empty('');
	        for ( var i in signalDetail ) {
	            $('#graph-detail').append("<li><a href='#'>" + signalDetail[i] + "</a></li>");
	        }
		} else if (val == "Detections"){
			selectedGraph['focus'] = FOCUS_DETECTIONS;
	        $('#graph-detail').empty('');
	        for ( var i in detectionDetail ) {
	            $('#graph-detail').append("<li><a href='#'>" + detectionDetail[i] + "</a></li>");
	        }
		}
	}

	function determineDetail(val){
		if (selectedGraph['focus'] == FOCUS_INJECTIONS){
			if (val == injectionDetail[0]){
				selectedGraph['detail'] = TYPE_OF_INJECTED_FUNCTION;
			} else if (val == injectionDetail[1]){
				selectedGraph['detail'] = BIT_LOCATION;
			} else if (val == injectionDetail[2]){
				selectedGraph['detail'] = INJECTED_FUNCTIONS;
			} else if (val == injectionDetail[3]){
				selectedGraph['detail'] = INJECTION_TYPE_FUNCTION;
			} else if (val == injectionDetail[4]){
				selectedGraph['detail'] = INJECTIONS_MAPPED_TO_LINE;
			}
		} else if (selectedGraph['focus'] == FOCUS_SIGNALS){
			if (val == signalDetail[0]){
				selectedGraph['detail'] = UNEXPECTED_TERMINATION;
			}
		} else if (selectedGraph['focus'] == FOCUS_DETECTIONS){
			if (val == detectionDetail[0]){
				selectedGraph['detail'] = NUM_TRIAL_WITH_DETECTION;
			} else if (val == detectionDetail[1]){
				selectedGraph['detail'] = DETECTED_BIT_LOCATION;
			} else if (val == detectionDetail[2]){
				selectedGraph['detail'] = DETECTION_LATENCY;
			}
		}
	}

	function determineType(val){
		if (val == "Bar Chart/Histogram"){
			selectedGraph['type'] = CHART_BAR;
		} else if (val == "Pie Chart"){
			selectedGraph['type'] = CHART_PIE;
		} else if (val == "Historgram"){
			selectedGraph['type'] = CHART_HIST;
		}

	}

	function determineRegion(val){
		if (val=="Entire Application"){
			selectedGraph['region'] = REGION_ALL;
			return false;
		} else if (val == "Stencil"){
			selectedGraph['region'] = REGION_STENCIL;
			return false;
		} else if (val == "Custom line numbers"){
			selectedGraph['region'] = REGION_SPECIFIC;
			return true;
		}
	}

}
