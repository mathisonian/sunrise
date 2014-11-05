'use strict';

var _ = require('lodash');
var utils = require('../utils');
var htmlContent = require('../../templates/includes/mobile-content.jade');

/*
 * View controller
 */
function MobileViewController($el) {
    if (!(this instanceof MobileViewController)) {
        return new MobileViewController($el);
    }

    this.$el = $el;
    this.$el.html(htmlContent({
        // template variables go here
        // e.g.
        //
        // someVar: something
    }));



}



MobileViewController.prototype.destroy = function() {
    this.$el.find('*').unbind().html();
};

module.exports = MobileViewController;

