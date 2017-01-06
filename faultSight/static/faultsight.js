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

function generateGraph(graph, locationId, inputId, svdIdName, chartType){
	if (graph[1].type === "single" && chartType == CHART_BAR){
        drawGraph(graph, locationId, svdIdName);
    } else if (graph[1].type === "single" && chartType == CHART_PIE){
        pieChartDonut(graph, locationId, svdIdName);
    } else if (graph[1].type === "multiple" && chartType == CHART_BAR){
        showStackedInput(inputId);
        stackedBarGraph(graph, locationId, inputId, svdIdName);
    } else if (graph[1].type === "multiple" && chartType == CHART_PIE){
        pieChartDonutStacked(graph, locationId, svdIdName);
    }


}

function drawMyGraphs(){
	// Draw MyGraphs (Default graphs for user - Determined in settings)
	for (var i = 0; i < myGraphList.length; i++){

		if (myGraphList[i][1].isEmpty){
            $("#my-graph-" + (i + 1)).append("<p>Attempted to create chart: <b>" + myGraphList[i][1].title + "</b>. Empty dataset returned. No chart will be generated.</p>");
        } else {
        	generateGraph(myGraphList[i], "#my-graph-" + (i + 1), "#my-graph-input-"+ (i + 1), "my-graph-" + (i+1) + "-svd", CHART_BAR);
	        $("#my-graph-save-button-" + (i+1)).fadeIn()
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
            }
        ],
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
        "customConstraints": {},
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
	    saveSettingsToFile();
	});
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
}

function clickBindInMainPage(){
	//For saving graphs that you have just created
	//Each save-graph-button class will have a data-location associated with it
	//This will contain the id of the svd we want to save
	$(".save-graph-button").click(function(e){
		var dataLocation = $(this).attr("data-location");
	    saveSvgAsPng(document.getElementById(dataLocation), "diagram.png", {backgroundColor:"#FFF"});
	});
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
        .orient("bottom");

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
    var iRadius = min / 2 * 0.8;
    var donutWidth = 75;                            
	var legendRectSize = 18;                                  
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
        .attr("id", svdIdName)
        .append('svg')
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
