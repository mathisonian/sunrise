'use strict';

var _ = require('lodash');
var utils = require('../utils');
var htmlContent = require('../../templates/includes/desktop-content.jade');
var Viz = require('../viz/viz');

/*
 * View controller
 */
function DesktopViewController($el, state) {
    if (!(this instanceof DesktopViewController)) {
        return new DesktopViewController($el);
    }

    this.$el = $el;
    this.$el.html(htmlContent({
        // template variables go here
        // e.g.
        //
        // someVar: something
    }));


    // maybe you want to instantiate a vizualization:
    //
    var viz = new Viz(this.$el.find('#dst-viz'));

    if(state.place) {
        viz.updatePlace(state.place);
        this.$el.find('#place-input').val(state.place);    
    } else {
        viz.updatePlace('nyc');
    }

    var self = this;

    this.$el.find('#place-input-form').submit(function(e) {
        e.preventDefault();
        var place = self.$el.find('#place-input').val();
        viz.updatePlace(place);
    });


    this.$el.find('.viz-suggestion').click(function(e) {
        viz.updatePlace($(this).text());
        self.$el.find('#place-input').val($(this).text());
    });

}




DesktopViewController.prototype.getState = function() {
    return {
        place: this.$el.find('#place-input').val()
    };
};


DesktopViewController.prototype.destroy = function() {
    this.$el.find('*').unbind().html();
};

module.exports = DesktopViewController;
