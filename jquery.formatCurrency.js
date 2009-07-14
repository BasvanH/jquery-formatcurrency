﻿//  This file is part of the jQuery formatCurrency Plugin.
//
//    The jQuery formatCurrency Plugin is free software: you can redistribute it
//    and/or modify it under the terms of the GNU General Public License as published 
//    by the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.

//    The jQuery formatCurrency Plugin is distributed in the hope that it will
//    be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
//    of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License along with 
//    the jQuery formatCurrency Plugin.  If not, see <http://www.gnu.org/licenses/>.

(function($) {

	$.formatCurrency = {};

	$.formatCurrency.regions = [];

	// default Region is en
	$.formatCurrency.regions[''] = {
		symbol: '$',
		positiveFormat: '%s%n',
		negativeFormat: '(%s%n)',
		decimalSymbol: '.',
		digitGroupSymbol: ',',
		groupDigits: true
	};

	$.fn.formatCurrency = function(destination, settings) {
				
		if (arguments.length == 1 && typeof destination !== "string") {
			settings = destination;
			destination = false;
		}

		// initialize defaults
		var defaults = {
			name: "formatCurrency",
			colorize: false,
			dropDecimals: false,
			region: '',
			global: true,
			roundToDecimalPlace: 2, // roundToDecimalPlace: -1; for no rounding; 0 to round to the dollar; 1 for one digit cents; 2 for two digit cents; 3 for three digit cents; ...
			alertOnDecimal: false
		};
		// initialize default region
		defaults = $.extend(defaults, $.formatCurrency.regions['']);
		// override defaults with settings passed in
		settings = $.extend(defaults, settings);

		// check for region setting
		if (settings.region.length > 0) {
			settings = $.extend(settings, getRegionOrCulture(settings.region));
		}

		return this.each(function() {
			$this = $(this);

			// get number
			var num = '0';
			num = $this[$this.is('input, select, textarea') ? 'val' : 'html']();
						
			//identify (123) as a negative number
			if (num.search('\\(') >= 0)
				num = '-' + num;

			// clean number
			var trimRegex = new RegExp("[^\\d" + settings.decimalSymbol + "-]", "g");
			num = num.replace(trimRegex, '');
			if (settings.decimalSymbol != '.')
				num = num.replace(settings.decimalSymbol, '.');  // reset to US decimal for arithmetic
			if (isNaN(num)) num = '0';

			// format number
			var isPositive = (num == (num = Math.abs(num)));
			var numParts = String(num).split('.');
			num = numParts[0];
			var hasDecimals = (numParts.length > 1);
			var decimals = (hasDecimals ? numParts[1].toString() : '0');
			if (hasDecimals && settings.alertOnDecimal)
				alert('Please do not enter any cents! (' + decimals + ')');
			if (settings.roundToDecimalPlace >= 0) {
				decimals = parseFloat('1.' + decimals); // prepend "0."; (IE does NOT round 0.50.toFixed(0) up, but (1+0.50).toFixed(0)-1
				decimals = decimals.toFixed(settings.roundToDecimalPlace); // round
				if (decimals.substring(0, 1) == '2')
					num = Number(num) + 1;
				decimals = decimals.substring(2); // remove "0."
			}
			num = String(num);

			if (settings.groupDigits) {
				for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
					num = num.substring(0, num.length - (4 * i + 3)) + settings.digitGroupSymbol + num.substring(num.length - (4 * i + 3));
				}
			}

			if (!settings.dropDecimals) {
				if ( hasDecimals && (settings.roundToDecimalPlace == -1) || (settings.roundToDecimalPlace > 0) ) {
					num += settings.decimalSymbol + decimals;
				}
			}

			// format symbol/negative
			var format = isPositive ? settings.positiveFormat : settings.negativeFormat;
			var money = format.replace(/%s/g, settings.symbol);
			money = money.replace(/%n/g, num);

			// setup destination
			if (!destination) {
				destination = $this;
			} else {
				destination = $(destination);
			}
			// set destination
			destination[destination.is('input, select, textarea') ? 'val' : 'html'](money);

			// colorize
			if (settings.colorize)
				destination.css('color', isPositive ? 'black' : 'red');
		});
	};

	// Remove all non numbers from text
	$.fn.toNumber = function(settings) {
		var defaults = $.extend({
			name: "toNumber",
			region: '',
			global: true
		}, $.formatCurrency.regions['']);

		settings = jQuery.extend(defaults, settings);
		if (settings.region.length > 0) {
			settings = $.extend(settings, getRegionOrCulture(settings.region));
		}

		return this.each(function() {
			var method = $(this).is('input, select, textarea') ? 'val' : 'html';
			var trimRegex = new RegExp("[^\\d" + settings.decimalSymbol + "-]", "g");
			$(this)[method]($(this)[method]().replace(trimRegex, ''));
		});
	};

	// returns the value from the first element as a number
	$.fn.asNumber = function(settings) {
		var defaults = $.extend({
			name: "asNumber",
			region: '',
			parse: true,
			parseType: 'Float',
			global: true
		}, $.formatCurrency.regions['']);
		settings = jQuery.extend(defaults, settings);
		if (settings.region.length > 0) {
			settings = $.extend(settings, getRegionOrCulture(settings.region));
		}

		settings.parseType = validateParseType(settings.parseType);

		var method = $(this).is('input, select, textarea') ? 'val' : 'html';
		var trimRegex = new RegExp("[^\\d" + settings.decimalSymbol + "-]", "g");
		var num = $(this)[method]();
		num = num ? num : "";
		num = num.replace(trimRegex, '');
		if (!settings.parse)
			return num;

		if (num.length == 0)
			num = '0';
		
		if (settings.decimalSymbol != '.')
			num = num.replace(settings.decimalSymbol, '.');  // reset to US decimal for arthmetic
				
		return window['parse' + settings.parseType](num);
	};

	function getRegionOrCulture(region) {
		var regionInfo = $.formatCurrency.regions[region];
		if (regionInfo) {
			return regionInfo;
		}
		else {
			if (/(\w+)-(\w+)/g.test(region)) {
				var culture = region.replace(/(\w+)-(\w+)/g, "$1");
				return $.formatCurrency.regions[culture];
			}
		}
		// fallback to extend(null) (i.e. nothing)
		return null;
	}

	function validateParseType(parseType) {
		switch(parseType.toLowerCase())
		{
			case 'int':
				return 'Int';
			case 'float':
				return 'Float';
			default:
				throw 'invalid parseType';
		}
	}

})(jQuery);