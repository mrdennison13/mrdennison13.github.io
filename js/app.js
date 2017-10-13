function createSvgElement(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function Application() {
    "use strict"
    var app = this;

    this.model = new Model();
    this.imgMargin = 20;
    this.pointSize = 2;
    this.nstates = 2;
    this.ntrial;
    this.steps = 0;
    this.pi_out=0.0;
    this.pisq_out=0.0;
    this.error_out=0.0;
    this.pi_act = 3.14159265358979;
    this.out_length = 6+2;       //how many sf to use to output pi
    this.pi_str = "0.000000";
    this.er_str = "0.000000";
    this.pi_Path = [[0,0,0]];
    
    this.svg;
    this.circleRadius = 180;
    this.svgWidth;
    this.svgHeight;

    

    function createImg() {

	app.svg = createSvgElement("svg");

	app.svgWidth = 2 * app.circleRadius + 2 * app.imgMargin;
	app.svgHeight = 2 * app.circleRadius + 2 * app.imgMargin;

	app.svg.setAttribute("width", app.svgWidth);
	app.svg.setAttribute("height", app.svgHeight);

	var square = createSvgElement("rect");
	square.setAttribute("x", app.svgWidth/2 - app.circleRadius);
	square.setAttribute("y", app.svgHeight/2 - app.circleRadius);
	square.setAttribute("width", app.circleRadius*2);
	square.setAttribute("height", app.circleRadius*2);
	square.setAttribute("stroke", "black");
	square.setAttribute("stroke-width", "3");
	square.setAttribute("fill", "#ffe6e6");
//	square.setAttribute("fill-opacity", "0.4");
	app.svg.appendChild(square);

	var circle = createSvgElement("circle");
	circle.setAttribute("cx", app.svgWidth/2);
	circle.setAttribute("cy", app.svgHeight/2);
	circle.setAttribute("r", app.circleRadius);
	circle.setAttribute("stroke", "black");
	circle.setAttribute("stroke-width", "3");
	circle.setAttribute("fill", "#e6e6ff");
//	circle.setAttribute("fill-opacity", "0.4");
	app.svg.appendChild(circle);

	document.getElementById("graph").appendChild(app.svg);	
    }
    
    function createInput_In() {


	var NTLabel = new Span("ntrials: ");
	var NTInput_In = new ModelInput(app.model, "n_trials");
	var speedLabel = new Span("speed: ");
	var speedInput_In = new ModelInput(app.model, "speed");
	var input_in = document.getElementById("input_in");

	input_in.appendChild(NTLabel.element);
	input_in.appendChild(NTInput_In.element);
	input_in.appendChild(document.createElement("br"));
	input_in.appendChild(speedLabel.element);
	input_in.appendChild(speedInput_In.element);
    }
    
    function createButtons() {
	var stepButton = new Button("Step", app.runSimulationSteps(1));
	var runButton = new Button("Run", app.startSimulation);
	var stopButton = new Button("Stop", app.stopSimulation);
	var resetButton = new Button("Reset", app.resetSimulation);
	
	var buttons = document.getElementById("buttons");
	buttons.appendChild(stepButton.element);
	buttons.appendChild(runButton.element);
	buttons.appendChild(stopButton.element);
	buttons.appendChild(resetButton.element);
    }
    
    function createStats() {
	var tr;
	var th;
	var td;
	var i;
	var span;

	var steps = new ModelSpan(app.model, "steps");
	var pi_str = new ModelSpan(app.model, "pi_str");
	var error_str = new ModelSpan(app.model, "error_str");
	var pi_out = new ModelSpan(app.model, "pi_out");
	var error_out = new ModelSpan(app.model, "error_out");
	
	var table = document.createElement("table");
	tr = document.createElement("tr");
	
	// Add headers
	th = document.createElement("th");
	tr.appendChild(th);
	for (i = 0; i < app.nstates; i++) {
	    th = document.createElement("th");
	    if (i==0) var textNode = document.createTextNode("In");
	    if (i==1) var textNode = document.createTextNode("Out");
	    th.appendChild(textNode);
	    tr.appendChild(th);
	}
	table.appendChild(tr);

	// Add count statistics
	tr = document.createElement("tr");
	td = document.createElement("td");
	td.appendChild(document.createTextNode("Number"));
	tr.appendChild(td);
	for (i = 0; i < app.nstates; i++) {
	    span = new ModelSpan(app.model, "count-" + i);
	    td = document.createElement("td");
	    td.appendChild(span.element);
	    tr.appendChild(td);
	}
	table.appendChild(tr);
	
	// Add count statistics
	tr = document.createElement("tr");
	td = document.createElement("td");
	td.appendChild(document.createTextNode("Percentage"));
	tr.appendChild(td);
	for (i = 0; i < app.nstates; i++) {
	    span = new ModelSpan(app.model, "percentage-" + i);
	    td = document.createElement("td");
	    td.appendChild(span.element);
	    tr.appendChild(td);
	}
	table.appendChild(tr);

	document.getElementById("steps").appendChild(steps.element);
	document.getElementById("pi_str").appendChild(pi_str.element);
	document.getElementById("error_str").appendChild(error_str.element);
	document.getElementById("stats").appendChild(table);
    }

    function createPlot() {
	app.dygraph = new Dygraph(document.getElementById("plot"), app.pi_Path, {
	    showRoller: false,
	    labels: ['Iter','pi_act','pi_calc'],
	    errorBars: true,
	    //ylabel: 'pi',
	    //xlabel: 'iterations',
	    series: {
		'pi_act':{
		    strokeWidth : 6,
		    color : "black"
		    //drawPoints: true,
		    //pointSize: 4//,
		    //errorBars: true
		},
                'pi_calc': {
		    drawPoints: true,
		    drawPointCallback : Dygraph.Circles.TRIANGLE,
		    drawHighlightPointCallback : Dygraph.Circles.TRIANGLE,
		    color : "red",
		    strokeWidth : 2.5,
		    fillAlpha : 0.3,
		    pointSize: 3.5
		}
	    }
	});
    }

    function updatePlot() {
	app.dygraph.updateOptions( { 'file': app.pi_Path } );
    }


    function performSteps(nsteps) {


	var i;
	if (nsteps == undefined) {
	    nsteps = 1;
	}
	var curState = app.model.get("state");
	
	var stateCount = [];
	for (i = 0; i < app.nstates; i++) {
	    stateCount[i] = 0;
	}

	var currentTime = app.model.get("steps");

	if (app.steps < 1){
	    app.ntrial = app.model.get("n_trials");
	}
	
	var n_over = 0;
	
	for (var step = 0; step < app.ntrial; step++) {
	    var nextState ;//= app.nstates - 1;
	    var x = Math.random()-0.5;
	    var y = Math.random()-0.5;
	    var r = x*x + y*y
	    if (r <= 0.25){
		n_over ++;
		nextState = 0;
	    } else {
		nextState = 1;
	    }    
	    app.model.set("count-" + nextState, app.model.get("count-" + nextState) + 1);
	    //app.pi_Path.push([currentTime + step, nextState + 1]);
	    stateCount[nextState]++;
	    curState = nextState;

	    x = app.svgWidth/2 + 2.0*app.circleRadius*x;
	    y = app.svgHeight/2 - 2.0*app.circleRadius*y;
	    
	    if(nextState==0){
		var circle = createSvgElement("circle");
		circle.setAttribute("cx", x);
		circle.setAttribute("cy", y);
		circle.setAttribute("r", app.pointSize / 2);
		circle.setAttribute("fill", "blue");
		circle.setAttribute("fill-opacity", "0.4");
		app.svg.appendChild(circle);
	    } else{
		var circle = createSvgElement("circle");
		circle.setAttribute("cx", x);
		circle.setAttribute("cy", y);
		circle.setAttribute("r", app.pointSize / 2);
		circle.setAttribute("fill", "red");
		app.svg.appendChild(circle);
	    }
	}
	document.getElementById("graph").appendChild(app.svg);

	app.steps = app.steps + nsteps;
	app.model.set("steps", app.steps*app.ntrial);
	var pi = 4.0*n_over/(app.ntrial);
	app.pi_out = app.pi_out + pi;
	app.pisq_out = app.pisq_out + pi*pi;
	var pi_tmp = app.pi_out / app.steps;
	app.pi_str = pi_tmp.toString();
	
	if (app.pi_str.length > app.out_length){
	    app.pi_str = app.pi_str.slice(0,app.out_length);
	} else{
	    app.pi_str = app.pi_str + "000000";
	    app.pi_str = app.pi_str.slice(0,app.out_length);
	}

	app.model.set("pi_str", app.pi_str);
	app.model.set("pi_out", pi_tmp);

	if (app.steps > 1){
	   // var error = ((app.pisq_out/(app.steps) - pi_tmp**2) / (app.steps-1))**0.5;
	    var error = ((app.pisq_out - app.steps * pi_tmp**2) / (app.steps * (app.steps-1)))**0.5;
	} else{
	    var error = 0.0;
	}
	app.er_str = error.toString();

	if (app.er_str.length > app.out_length){
	    app.er_str = app.er_str.slice(0,app.out_length);
	} else{
	    app.er_str = app.er_str + "000000";
	    app.er_str = app.er_str.slice(0,app.out_length);
	}
	
	app.model.set("error_str", app.er_str);
	app.model.set("error_out", error);

	if (app.steps == 1){
	   // app.pi_Path = [[app.steps*app.ntrial, app.pi_act, app.pi_out / app.steps]];
	    app.pi_Path = [[app.steps*app.ntrial, [app.pi_act,0.0], [app.pi_out / app.steps, error]]];
	} else{
	   // app.pi_Path.push([app.steps*app.ntrial, app.pi_act, app.pi_out / app.steps]);
	    app.pi_Path.push([app.steps*app.ntrial, [app.pi_act,0.0], [app.pi_out / app.steps, error]]);
	}
	
	for (i = 0; i < app.nstates; i++) {
	    var count = app.model.get("count-" + i);
	    app.model.set("percentage-" + i, (100 * count / (app.steps*app.ntrial)).toFixed(1) + "%  ");
	}
	
	updatePlot();

	// Update the graph
	if (nsteps == 1) {
	    var speed = app.model.get("speed");
	    app.selectState(-1);
	    setTimeout(updateGraphColors, speed * 0.2);
	} else {
	    updateGraphColors();
	}
    }
    
    this.selectState = function(state) {
	app.model.set("state", state);
	for (var i = 0; i < app.nstates; i++) {
	    app.model.set("state-" + i, (i == state) ? 1 : 0);
	}
    }
    

    this.stopSimulation = function() {
	app.selectState(app.getState());
	if (app.timer != undefined) {
	    clearInterval(app.timer);
	    app.timer = undefined;
	}
    };
    
    this.runSimulationSteps = function(nsteps) {
	return function() {
	    performSteps(nsteps); 
	};
    };

    this.startSimulation = function() {
	app.stopSimulation();
	var speed = parseInt(app.model.get("speed"));
	app.timer = setInterval(app.runSimulationSteps(1), 1000 / speed);
    };
    
    this.resetSimulation = function() {
	app.stopSimulation();
	app.model.set("steps", 0);
	app.model.set("pi_out", 0.0);
	app.model.set("error_out", 0.0);
	app.model.set("pi_str", "0.000000");
	app.model.set("error_str", "0.000000");
	app.pi_out = 0.0;
	app.pisq_out = 0.0;
	app.error_out = 0.0;
	app.steps = 0
	app.pi_Path = [[0,0,0]];
	for (var i = 0; i < app.nstates; i++) {
	    app.model.set("count-" + i, 0);
	    app.model.set("percentage-" + i, "-");
	}
	//reset the plot
	document.getElementById("graph").removeChild(app.svg);
	createImg();
	updatePlot();
    };
    
    this.setSpeed = function(speed) {
	app.model.set("speed", speed);
    };

    this.setNT = function(NT) {
	app.model.set("n_trials", NT);
    };

    
    this.getState = function() {
	return app.model.get("state");
    };
    

    this.start = function() {
	createButtons();
	createImg();
	createInput_In();
	createStats();
	createPlot();

	app.setSpeed(1);
	app.setNT(100);
	app.selectState(0);

	for (var i = 0; i < app.nstates; i++) {
	    app.model.set("count-" + i, 0);
	    app.model.set("percentage-" + i, "-");
	}
	
	
	app.model.set("steps", 0);
	app.model.set("pi_out", 0.0);
	app.model.set("error_out", 0.0);
	app.model.set("pi_str", "0.000000");
	app.model.set("error_str", "0.000000");
	
	app.resetSimulation();
    };
}

