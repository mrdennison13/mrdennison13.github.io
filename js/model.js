function Model() {
  var model = this;
  this._values = {};
  this._valueListeners = {};
  
  this.get = function(name) {
    return model._values[name];
  };
  
  this.set = function(name, newValue) {
    var currentValue = model._values[name];
    if (newValue != currentValue) {
      model._values[name] = newValue;
      if (name in model._valueListeners) {
        var listeners = model._valueListeners[name];
        for (var i = 0; i < listeners.length; i++) {
          listeners[i](newValue);
        }
      }
    }
  };
  
  this.listen = function(name, fn) {
    if (!(name in model._valueListeners)) {
      model._valueListeners[name] = [];
    }
    model._valueListeners[name].push(fn);
  };
}

function ModelInput(model, valueName) {
  var modelInput = this;
  
  this.element = document.createElement("input");
  
  this.updateValue = function (newValue) {
    if (newValue == undefined) {
      newValue = "";
    }
    modelInput.element.setAttribute("value", newValue);
  };
  
  this.onChange = function () {
    var value = modelInput.element.value;
    model.set(valueName, value);
  };

  model.listen(valueName, this.updateValue);
  
  this.element.oninput = this.onChange;
  
  this.updateValue();
};

function ModelSpan(model, valueName) {
  var modelInput = this;
  var textNode = document.createTextNode("");
  
  this.element = document.createElement("span");  
  this.element.appendChild(textNode);
  
  this.updateValue = function (newValue) {
    if (newValue == undefined) {
      newValue = "";
    }
    textNode.nodeValue = newValue;
  };
  
  model.listen(valueName, this.updateValue);

  this.updateValue();
}

function Button(text, onClick) {
  this.element = document.createElement("button");
  
  if (onClick != undefined) {
    this.element.onclick = onClick;
  }
  
  var textNode = document.createTextNode(text);
  this.element.appendChild(textNode);
}

function Span(text) {
  this.element = document.createElement("span");
  var textNode = document.createTextNode(text);
  this.element.appendChild(textNode);
}

