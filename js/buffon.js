var app = new Application();
$(document).ready(app.start);


function createSvgElement(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function Application() {
    "use strict"
    var app = this;

    this.model = new Model();
    this.imgMargin = 20;
    this.needleLength;
    this.needleHalfLength;
    this.needleTwoLength;
    this.nstates = 2;
    this.ntrial;
    this.n_steps = 0;
    this.n_over = 0;
    this.pi_out=0.0;
    this.pisq_out=0.0;
    this.error_out=0.0;
    this.pi_act = 3.14159265358979;
    this.twopi = 2.0*app.pi_act;
    this.out_length = 6+2;       //how many sf to use to output pi
    this.pi_str = "0.000000";
    this.er_str = "0.000000";
    this.pi_Path = [[0,0,0]];
    this.fac_pi;
    this.fac_pisq;
    
    this.nlines = 5;
    this.dx;
    
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

	var line;
	app.dx = 2.0*app.circleRadius/(app.nlines-1);
	
	for (var i = 0; i < app.nlines; i++) {
	    line = createSvgElement("line");
	    line.setAttribute("x1", app.svgWidth/2 - app.circleRadius + i*app.dx);
	    line.setAttribute("y1", app.svgHeight/2 - app.circleRadius);
	    line.setAttribute("x2", app.svgWidth/2 - app.circleRadius + i*app.dx);
	    line.setAttribute("y2", app.svgHeight/2 + app.circleRadius);
	    line.setAttribute("stroke", "blue");
	    line.setAttribute("stroke-width", "5");
	    app.svg.appendChild(line);
	}


	document.getElementById("graph").appendChild(app.svg);	
    }
    
    function createInput_In() {


	var lenLabel = new Span("length (ratio): ");
	var lenInput_In = new ModelInput(app.model, "len_ratio");
	var NTLabel = new Span("n_trial: ");
	var NTInput_In = new ModelInput(app.model, "n_trials");
	var speedLabel = new Span("speed: ");
	var speedInput_In = new ModelInput(app.model, "speed");
	var input_in = document.getElementById("input_in");

	input_in.appendChild(NTLabel.element);
	input_in.appendChild(NTInput_In.element);
	input_in.appendChild(document.createElement("br"));
	input_in.appendChild(speedLabel.element);
	input_in.appendChild(speedInput_In.element);
	input_in.appendChild(document.createElement("br"));
	input_in.appendChild(document.createElement("br"));
	input_in.appendChild(lenLabel.element);
	input_in.appendChild(lenInput_In.element);

    }
    
    function createButtons() {
	var stepButton = new Button("Step", app.runSimulationSteps());
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
	    if (i==0) var textNode = document.createTextNode("Over");
	    if (i==1) var textNode = document.createTextNode("Not over");
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
		    strokeWidth : 7,
		    color : "black"
		},
                'pi_calc': {
		    drawPoints: true,
		    drawPointCallback : Dygraph.Circles.TRIANGLE,
		    drawHighlightPointCallback : Dygraph.Circles.TRIANGLE,
		    color : "red",
		    strokeWidth : 2,
		    fillAlpha : 0.3,
		    pointSize: 4
		}
	    }
	});
    }






    

    function updatePlot() {
	app.dygraph.updateOptions( { 'file': app.pi_Path } );
    }


    function performSteps() {

	var i;
	
	var stateCount = [];
	for (i = 0; i < app.nstates; i++) {
	    stateCount[i] = 0;
	}

	if (app.n_steps == 0){
	    app.ntrial = parseInt(app.model.get("n_trials"));
	    if (app.model.get("len_ratio") >= 1.0){
		app.needleLength = app.dx*0.999;
	    } else {
		app.needleLength = app.dx*app.model.get("len_ratio");
	    }
	    app.needleHalfLength = app.needleLength/2.0;
	    app.needleTwoLength = app.needleLength*2.0;
	    app.fac_pi = app.dx/app.needleTwoLength;
	    app.fac_pisq = app.fac_pi*app.fac_pi;
	}
	
	var i_in;
	var x;
	var xx;
	var y;
	var r;
	var theta;
	var cth;
	var sth;
	for (var step = 0; step < app.ntrial; step++) {
	    
	    x = Math.random()-0.5;
	    y = Math.random()-0.5;
	    x = 2.0*app.circleRadius*x;
	    y = app.svgHeight/2 - 2.0*app.circleRadius*y;
	    xx = x - app.dx*Math.round(x/app.dx);
	    theta = app.pi_act*Math.random();
	    cth = app.needleHalfLength * Math.cos(theta);
	    sth = app.needleHalfLength * Math.sin(theta);
	    x = app.svgWidth/2 + x
	    
	    
	    if (Math.abs(xx) <= sth){
		app.n_over ++;
		i_in = 0;

		var line = createSvgElement("line");
		line.setAttribute("x1", x + sth);
		line.setAttribute("y1", y + cth);
		line.setAttribute("x2", x - sth);
		line.setAttribute("y2", y - cth);
		line.setAttribute("stroke", "red");
		line.setAttribute("stroke-width", "3");
		app.svg.appendChild(line);
		
	    } else {
		i_in = 1;

		var line = createSvgElement("line");
		line.setAttribute("x1", x + sth);
		line.setAttribute("y1", y + cth);
		line.setAttribute("x2", x - sth);
		line.setAttribute("y2", y - cth);
		line.setAttribute("stroke", "yellow");
		line.setAttribute("stroke-width", "3");
		app.svg.appendChild(line);
		
	    }    

	    app.model.set("count-" + i_in, app.model.get("count-" + i_in) + 1);

	}
	
	document.getElementById("graph").appendChild(app.svg);

	app.n_steps = app.n_steps + app.ntrial;
	
	app.model.set("steps", app.n_steps);
	
	if (app.n_over > 0){
	    var pi_inv   =  app.fac_pi  * parseFloat(app.n_over) / parseFloat(app.n_steps);
	    var pi_invsq = app.fac_pisq * parseFloat(app.n_over) / parseFloat(app.n_steps);
	    app.pi_out = 1.0/pi_inv;
	}else {
	    var pi_inv   = 0.0;
	    var pi_invsq = 0.0;
	    app.pi_out = 0.0;
	}
	
	app.pi_str = app.pi_out.toString();
	
	if (app.pi_str.length > app.out_length){
	    app.pi_str = app.pi_str.slice(0,app.out_length);
	} else{
	    app.pi_str = app.pi_str + "000000";
	    app.pi_str = app.pi_str.slice(0,app.out_length);
	}

	app.model.set("pi_str", app.pi_str);
	app.model.set("pi_out", app.pi_out);

	if (app.n_steps > 1){
	    var variance = pi_invsq - pi_inv*pi_inv;
	    var error = Math.sqrt(variance / (app.n_steps));
	    error = error*(app.pi_out*app.pi_out);
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

	if (app.n_over > 0){
	    if (app.n_steps == 1){
		app.pi_Path = [[app.n_steps, [app.pi_act,0.0], [app.pi_out, error]]];
	    } else{
		app.pi_Path.push([app.n_steps, [app.pi_act,0.0], [app.pi_out, error]]);
	    }
	}
	
	for (i = 0; i < app.nstates; i++) {
	    var count = app.model.get("count-" + i);
	    app.model.set("percentage-" + i, (100 * count / (app.n_steps*app.ntrial)).toFixed(1) + "%  ");
	}
	
	updatePlot();

	// Update the graph

	var speed = app.model.get("speed");
	app.selectState(-1);
	setTimeout(updateGraphColors, speed * 0.2);

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
    
    this.runSimulationSteps = function() {
	return function() {
	    performSteps(); 
	};
    };

    this.startSimulation = function() {
	app.stopSimulation();
	var speed = parseInt(app.model.get("speed"));
	app.timer = setInterval(app.runSimulationSteps(), 1000 / speed);
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
	app.n_steps = 0
	app.n_over = 0
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

    this.setLen = function(len) {
	app.model.set("len_ratio", len);
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
	app.setLen(0.5);
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

