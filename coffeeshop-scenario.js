

var locations =
["AlexisHouse", "BrianHouse", "CoffeeShop", "CorrynHouse",
"Park"]

var characters =
["Alexis", "Brian", "Corryn"]

// State
var location_of =
{ "Alexis": "AlexisHouse",
"Brian": "CoffeeShop",
"notebook": "AlexisHouse",
"pen":"AlexisHouse",
"Corryn": "CorrynHouse",
"book": "CorrynHouse",
"bike": "CorrynHouse",
"cash register": "CoffeeShop",
"coffee": "CoffeeShop",
"table": "CoffeeShop"
}

var clothing_on =
{"Alexis": "",
"Brian": "",
"Corryn": ""
}


var conversation_log =
{
  "AlexisHouse": [],
  "BrianHouse": [],
  "CorrynHouse": [],
  "CoffeeShop": [],
  "Park": [],
}

var current_choices;


function choiceToString(c) {
  var {op, args} = c;
  var str = "";

  switch(op) {
    case "take": {
      return "Take "+args[1];
    }
    case "go": {
      return "Go to "+args[1];
    }
    case "talk": {
      return "Talk to "+args[1];
    }
    case "give": {
      return "Give "+args[2]+" to "+args[1];
    }
    case "wear": {
      return "Wear "+args[1];
    }
  }
}

function displayState() {
  toRender = "";

  // stuff at all locations
  for (var i = 0; i < locations.length; i++) {
    var stuff = whatsAt(locations[i]);
    toRender += "<b>At "+locations[i]+":</b>";
    if(stuff.length > 0) {
      toRender += "<p>"+ stuff.toString() + "<br>";
    }

    if(conversation_log[locations[i]].length > 0) {
      toRender += conversation_log[locations[i]][0];
      toRender += "<br>";
    }
    toRender += "</p>";
  }
  document.getElementById("state").innerHTML = toRender;

}

function displayChoices() {
  // current_choices = generate_choices();
  toRender = "";
  for (var i = 0; i < current_choices.length; i++) {
    var choice = current_choices[i];
    var last_character;
    if (choice.args[0] != last_character) {
      toRender += "<br>"+"Actions for "+choice.args[0]+"<br>";
    }
    toRender += "<a onclick=selectChoice("+i+") href=javascript:void(0);>"+choiceToString(choice)+"</a><br>";

    last_character = choice.args[0];
  }
  document.getElementById("choices").innerHTML = toRender;
}

function render() {
  current_choices = generate_choices();
  displayState();
  displayChoices();
}

function selectChoice(index) {

  var display_text = applyOper(current_choices[index]);

  document.getElementById("response").innerHTML = display_text;

  // current_choices = generate_choices();
  render();
}

function cmdToAction(cmd) {
  var {op, args} = cmd;

  switch(op) {
    case "take": {
      return take(args[0], args[1]);
    }
    case "go": {
      return go(args[0], args[1]);
    }
    case "talk": {
      return talk(args[0], args[1]);
    }
    case "give": {
      return give(args[0], args[1], args[2]);
    }
    case "wear": {
      return wear(args[0], args[1]);
    }
    default: return undefined;
  }
}

// returns text to display upon applying cmd
function applyOper(cmd) {

  var displayText = "Action not defined!"; // to return at the end

  var action = cmdToAction(cmd);

  if(action != undefined && action.applies) {
    action.effects();
    displayText = action.text;
  }
  return displayText;
}

function whatsAt(loc) {
  var things = [];
  for(var thing in location_of) {
    if(location_of[thing] == loc) {
      things.push(thing);
    }
  }
  return things;
}

function generate_choices () {
  choices = [];
  // for each character, see what they can do
  for(var ci in characters) {
    var c = characters[ci];
    var loc = location_of[c];
    var things = whatsAt(loc);
    var things_held = whatsAt(c);
    // things at location of each character
    for(var ti in things) {
      var thing = things[ti];
      if(characters.indexOf(thing) < 0) {
        // taking it
        choices.push({op:"take", args:[c, thing]});
      }
      else {
        // talking to it
        if(thing != c) {
          choices.push({op:"talk", args:[c, thing]});
        }
      }


    } // end loop over things at location of c


    for(var thi in things_held) {
      thing_held = things_held[thi];

      // giving it
      for(var ci2 in characters) {
        var c2 = characters[ci2];
        if (c != c2 && loc == location_of[c2]) {
          choices.push({op:"give", args:[c, c2, thing_held]});
        }
      }

      // wearing it
      if (clothing_on[c] != thing_held) {
        choices.push({op:"wear", args:[c, thing_held]});
      }
    }

    // places to move
    for(var li in locations) {
      var l = locations[li];
      if(l != loc) {
        choices.push({op:"go", args:[c, l]});
      }
    }

  } //end loop over characters
  return choices;

}

function begin() { render(); }

// Operator specification

// take
// preconditions: X and A in same place
// effect: has X A
// turns: 1
function take(agent, thing) {

  var applies = location_of[agent] == location_of[thing];

  function effects() {
    location_of[thing] = agent;
  }

  var text = agent+" takes the "+thing+".";

  return {applies:applies, effects:effects, text:text};

}


// go
// preconditions: none
// effects: at X L
// turns: = distance between places
function go(agent, place) {

  var applies = true; // for now

  function effects() {
    location_of[agent] = place;
  }

  var text = agent+" goes to "+place;

  return {applies:applies, effects:effects, text:text};

}

// wear
// preconditions: has X A
// effects: wearing X A
// turns: 1
function wear(agent, thing) {

  var applies = agent == location_of[thing];
  var text;

  function effects() {
    clothing_on[agent] = thing;
  }

  if (clothing_on[agent] == "") {
    text = agent+" wears "+thing;
  }
  else {
    text = agent+" takes off "+clothing_on[agent]+" and wears "+thing;
  }

  return {applies:applies, effects:effects, text:text};

}

// talk
// preconditions: X and Y in L
// effects: none
// turns: 1-3
function talk(agent1, agent2) {

  var loc = location_of[agent1];
  var applies = loc == location_of[agent2];

  function effects() {
    var line = agent1+" says hello to "+agent2;
    conversation_log[loc] = [line];
  }

  return {applies:applies, effects:effects, text:""};

}

// give
// preconditions: X has A, X and Y in L
// effects: Y has A
// turns: 1
function give(agent1, agent2, thing) {
  var loc = location_of[agent1];
  var applies = agent1 == location_of[thing] && loc == location_of[agent2];

  function effects() {
    location_of[thing] = agent2

    if (clothing_on[agent1] == thing) {
      clothing_on[agent1] = "";
    }
  }

  var text = agent1+" gives "+thing+" to "+agent2;

  return {applies:applies, effects:effects, text:text};
}
