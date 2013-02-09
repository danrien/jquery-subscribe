(function($) {
	var plugin = this;
	var variables = {};	
	
	Uuid = function(
		  a // placeholder
		){
		  return a // if the placeholder was passed, return
		    ? ( // a random number from 0 to 15
		      a ^ // unless b is 8,
		      ((new Date().getTime()) + Math.random()) % 16 // in which case
		      * 16 // a random number from
		      >> a/4 // 8 to 11
		      ).toString(16) // in hexadecimal
		    : ( // or otherwise a concatenated string:
		      [1e7] + // 10000000 +
		      -1e3 + // -1000 +
		      -4e3 + // -4000 +
		      -8e3 + // -80000000 +
		      -1e11 // -100000000000,
		      ).replace( // replacing
		        /[018]/g, // zeroes, ones, and eights with
		        Uuid // random hex digits
		      );
		};
	
	var indexVariable = function(variable) {
		var self = this;
		self.variable = variable;
		var subscribedElements = new Array();
		
		var val = null;
		self.value = function(newValue) {
			if (!newValue) return val;
			if (val == newValue) return;
			
			val = newValue;
			for (i in subscribedElements) subscribedElements[i].value(newValue);
		};
		
		self.add = function(newObject) { subscribedElements.push(newObject); };
	};
	
	var subscribedObject = function(owner, object, beforeUpdate, afterUpdate) {
		var subscriber = this;
		var _owner = owner;
		var _object = object;
		object = subscriber;
		
		subscriber.value = function(newValue) {
			if (newValue == null || newValue === "undefined") return _owner.value();
			
			if (newValue == subscriber.value()) return;
			
			if (beforeUpdate != null && $.type(beforeUpdate) === "function") newValue = beforeUpdate.call(_object, newValue);
			_owner.value(newValue);
			if (afterUpdate != null && $.type(afterUpdate) === "function") afterUpdate.call(_object, newValue);
		};
		
		_owner.value(subscriber.value());
	};
	
	var subscribedElement = function(owner, element, beforeUpdate, afterUpdate) {
		var subscriber = this;
		var _owner = owner;
		var _element = element;
		
		var changeSubscriber = function() {
			var newValue = subscriber.value();
			if (beforeUpdate != null && $.type(beforeUpdate) === "function") newValue = beforeUpdate.call(_element, newValue);
			_owner.value(newValue);
		};
		
		$(_element).change(changeSubscriber);
		
		subscriber.value = function(newValue) {
			var $element = $(_element);
			
			if (newValue == null || newValue === "undefined") return $element.is("input, select, textarea") ? $element.val() : $element.text();
			if (newValue == subscriber.value()) return;
			
			if ($element.is("input, select, textarea")) $element.val(newValue);
			else $element.text(newValue);
			
			if (afterUpdate != null && $.type(afterUpdate) === "function") {
				$element.off("change", changeSubscriber);
				afterUpdate.call(_element, newValue);
				$element.on("change", changeSubscriber);
			}
		};
		
		// call value to set owner value and other subscribed row values
		_owner.value(subscriber.value());
	};
	
	plugin.methods = {
		add : function(options) {		
			var settings = $.extend({}, options);
			
			var variable = settings['variable'] ? settings['variable'] : Uuid();
			
			return this.each(function() {
				if (!variables.hasOwnProperty(variable)) variables[variable] = new indexVariable(variable);
				
				if (!$.isPlainObject(this))
					variables[variable].add(new subscribedElement(variables[variable], this, settings['beforeUpdate'], settings['afterUpdate']));
				else
					variables[variable].add(new subscribedObject(variables[variable], this, settings['beforeUpdate'], settings['afterUpdate']));
			});
		},

		/* if variable is supplied, return the first value from a subscriber for that,
		 * otherwise, return all the variables subscribed to the given objects
		 */
		get : function(variable) {
			var object = this;
			var returnVariables = {};
			
			if (variable) return returnVariables = { variable : variables[variable] };
			
			object.each(function() {
				for (s in variables) {
					for (o in variables[s])
						if (variables[s][o].object == this) returnVariables[s] = variables[s];
				}
			});
			
			return subscribers;
		}
	};
	
	$.fn.subscribe = function(method, options) {

		if (!method) method = 'add';
		
		// Method calling logic
	    if ( methods[method] ) {
	      return plugin.methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object') {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jQuery.subscribe' );
	    }
  };
}) (jQuery);