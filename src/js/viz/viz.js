'use strict';

var _ = require('lodash');
var utils = require('../utils');
var d3 = require('d3');
var sunCalc = require('suncalc');
var geocoder = require('geocoder');
var Path = require('svg-path-generator');


var margin = {
    top: 20,
    right: 0,
    bottom: 20,
    left: 0
};


var dayOfYear = function(d) {
    var j1 = new Date(d);
    j1.setMonth(0, 0);
    return Math.round((d - j1) / 8.64e7) - 1;
};


/*
 * View controller
 */
function Viz($el) {
    if (!(this instanceof Viz)) {
        return new Viz($el);
    }

    this.$el = $el;

    var $tooltip = $('#tooltip');

    // do some cool vizualization here

    var width = $el.width() - margin.left - margin.right;
    var height = (Math.min(width * 0.6, $(document).height() - $el.offset().top - 180)) - margin.top - margin.bottom;


    var today = new Date();
    var start = new Date(today.getFullYear(), 0, 1, 12, 0, 0, 0, 0);
    var end = new Date(today.getFullYear(), 11, 31, 12, 0, 0, 0, 0);

    var dateX = d3.time.scale().domain([start, end]).range([0, width]);

    this.x = d3.scale.linear()
        .domain([0, 365])
        .range([0, width]);

    this.y = d3.scale.linear()
        .domain([0, 24])
        .range([0, height]);

    var inverseX = d3.scale.linear()
        .range([0, 365])
        .domain([0, width]);


    var xAxis = d3.svg.axis()
        .scale(dateX);


    var svg = d3.select($el[0])
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .classed('container', true)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    var self = this;

    var hideTimeout;
    svg.on('mousemove', function() {

        if(!self.times.length) {
            return;
        }
        var coordinates = d3.mouse(this);
        var x = coordinates[0];
        var i = inverseX(x);
        i = Math.floor(i);

        self.svg.selectAll('g.day').classed('hover', function(d, idx) {

            return idx === i;
        });



        var format = d3.time.format('%B %e');
        $tooltip.find('.date').text(format(self.dates[i]));

        var sunset = new Date(self.times[i].sunset);
        var sunrise = new Date(self.times[i].sunrise);

        format = d3.time.format('%I:%M %p');

        console.log(format(sunrise));
        console.log(format(sunset));
        
        
        $tooltip.find('.sunrise').text(format(sunrise));
        $tooltip.find('.sunset').text(format(sunset));

        var offset = self.$el.offset();
        var top = offset.top;
        top += self.y(sunrise.getHours() + sunrise.getMinutes() / 60);
        var left = self.x(i) + offset.left;

        left -= $tooltip.width() / 2;
        top -= $tooltip.height() - 15;


        $tooltip.css('top', top).css('left', left).show();
        clearTimeout(hideTimeout);

    }).on('mouseout', function(){
        hideTimeout = setTimeout(function() {
            $tooltip.fadeOut();
            self.svg.selectAll('g.day').classed('hover', false);
        }, 750);
    });

    d3.select($tooltip[0]).on('mouseenter', function() {
        clearTimeout(hideTimeout);
    });



    this.svg = svg;


    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height);
    

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);



    var max = 0;
    for (var d = start, i=0; d < end; d.setDate(d.getDate() + 1), i++) {
        this._drawDay(i);
        if(i > max) {
            max = i;
        }
    } 

    var avgGroup = this.svg.append('g').classed('average', true);

    avgGroup
        .append('path')
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(0), self.y(12))
                .horizontalLineTo(self.x(max))
                .end(); 
        })
        .classed('sunrise', true);
    avgGroup
        .append('path')
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(0), self.y(12))
                .horizontalLineTo(self.x(max))
                .end(); 
        })
        .classed('sunset', true);


    avgGroup
        .append('text')
        .attr('x', self.x(50))
        .attr('y', self.y(12))
        .style('opacity', 0)
        .classed('sunrise', true);


    avgGroup
        .append('text')
        .attr('x', self.x(250))
        .attr('y', self.y(12))
        .style('opacity', 0)
        .classed('sunset', true);



    this.svg
        .append('path')
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(0), self.y(today.getHours() + today.getMinutes() / 60))
                .horizontalLineTo(self.x(max))
                .end(); 
        })
        .classed('now', true);

    


}

Viz.prototype.updatePlace = function(placeName) {

    var self = this;

    if(placeName.trim() === '') {
        return;
    }

    var times = [];
    var dates = [];

    geocoder.geocode(placeName, function(err, res) {
        
        if(err) {
            return console.log(err);
        }

        if(!res.results.length) {
            return $('.place-name-container').text('Could not find ' + placeName + '!');
        }

        $('.place-name-container').text(res.results[0].formatted_address);

        
        var location = res.results[0].geometry.location;
        var today = new Date();
        var start = new Date(today.getFullYear(), 0, 1, 12, 0, 0, 0, 0);
        var end = new Date(today.getFullYear()+1, 0, 1, 12, 0, 0, 0, 0);

        for (var d = start, i=0; d < end; d.setDate(d.getDate() + 1), i++) {

            var time = sunCalc.getTimes(d, location.lat, location.lng);


            var isToday = false;
            if(d.getDate() === today.getDate() && d.getMonth() === today.getMonth()) {
                console.log('Today!');
                console.log(d);
                isToday = true;
            }

            self._updateToday(time);
            self._updateLine(i, time, isToday);
            times.push(time);
            dates.push(new Date(d));
        }

        self._updateAverages(times);
    });

    this.times = times;
    this.dates = dates;
};

Viz.prototype._updateToday = function(times) {

};

Viz.prototype._updateAverages = function(times) {

    var avgSunrise = 0, avgSunset = 0;
    _.each(times, function(time, i) {
        var sunrise = new Date(time.sunrise);
        var sunset = new Date(time.sunset);

        if(sunset.getDate() !== sunrise.getDate()) {

            if(dayOfYear(sunrise) !== i) {
                avgSunrise -= 24;    
            } else {
                avgSunset += 24;
            }
        }
        avgSunset += sunset.getHours() + sunset.getMinutes() / 60;
        avgSunrise += sunrise.getHours() + sunrise.getMinutes() / 60;
    });

    avgSunset /= times.length;
    avgSunrise /= times.length;

    avgSunrise = (avgSunrise + 24) % 24;
    avgSunset = (avgSunset + 24) % 24;


    var avg = this.svg.select('g.average');
    var self = this;

    avg.select('path.sunrise')
        .transition()
        .delay(150)
        .duration(1500)
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(0), self.y(avgSunrise))
                .horizontalLineTo(self.x(times.length))
                .end(); 
        });


    avg.select('path.sunset')
        .transition()
        .delay(150)
        .duration(1500)
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(0), self.y(avgSunset))
                .horizontalLineTo(self.x(times.length))
                .end(); 
        });


    var format = d3.time.format('%I:%M %p');
    var getTimeZone = function() {
        return /\((.*)\)/.exec(new Date().toString())[1];
    };

    var formatHour = function(n) {

        var d = new Date();
        var hour = Math.floor(n);
        var minutes = n - Math.floor(n);
        minutes = Math.round(minutes * 60);

        d.setHours(hour);
        d.setMinutes(minutes);

        return format(d) + ' (' + getTimeZone() + ')';
    };


    avg.select('text.sunrise')
        .transition()
        .delay(150)
        .duration(1500)
        .style('opacity', 1)
        .attr('y', function() {
            if(avgSunrise < 4) {
                return self.y(avgSunrise) + 20;
            }
            return self.y(avgSunrise) - 7;
        })
        .text(function() {
            return 'Average Sunrise: ' + formatHour(avgSunrise);
        });
    avg.select('text.sunset')
        .transition()
        .delay(150)
        .duration(1500)
        .style('opacity', 1).attr('y', function() {
            if(avgSunset < 4) {
                return self.y(avgSunset) + 20;
            }
            return self.y(avgSunset) - 7;
        })
        .text(function() {
            return 'Average Sunset: ' + formatHour(avgSunset);
        });
};


Viz.prototype._updateLine = function(i, times, today) {

    var sunrise = new Date(times.sunrise);
    var sunset = new Date(times.sunset);

    today = today || false;

    var self = this;

    var group = this.svg.selectAll('g.day').filter(function(d, idx) {
        return i === idx;
    });

    var start = self.y(sunrise.getHours() + sunrise.getMinutes() / 60);
    var end = self.y(sunset.getHours() + sunset.getMinutes() / 60);
    if(start < end) {
        
        group
            .select('path.day')
            .transition()
            .duration(1500)
            .attr('d', function() {
                return new Path()
                    .moveTo(self.x(i), start)
                    .verticalLineTo(end)
                    .end();
            });


        group
            .select('path.day-wrap')
            .transition()
            .duration(1500)
            .attr('d', function() {
                return new Path()
                    .moveTo(self.x(i), self.y(24))
                    .verticalLineTo(self.y(24))
                    .end();
            })
            .style('stroke-width', 0);

    } else {

        group
            .select('path.day')
            .transition()
            .duration(1500)
            .attr('d', function() {
                return new Path()
                    .moveTo(self.x(i), 0)
                    .verticalLineTo(end)
                    .end();
            });

        group
            .select('path.day-wrap')
            .transition()
            .duration(1500)
            .attr('d', function() {
                return new Path()
                    .moveTo(self.x(i), start)
                    .verticalLineTo(self.y(24))
                    .end();
            })
            .style('stroke-width', (today) ? 2 : 0.5);
    }

}

Viz.prototype._drawDay = function(i) {

    var today = dayOfYear(new Date()) === i;

    var self = this;

    var group = this.svg.append('g').classed('day', true);

    group
        .append('path')
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(i + 0.5), self.y(11.9))
                .verticalLineTo(self.y(12.1))
                .end();
        })
        // .style('stroke-width', self.x(i+1) - self.x(i) - .5)
        .style('stroke-width', function() {
            if(today) {
                return 2;
            }
            return 0.5;
        })
        .classed('day', true)
        .classed('today', today);

    group
        .append('path')
        .attr('d', function() {
            return new Path()
                .moveTo(self.x(i + 0.5), self.y(24))
                .verticalLineTo(self.y(24))
                .end();
        })
        .classed('day-wrap', true)
        .classed('today', today);

};



Viz.prototype.destroy = function() {
    // destroy d3 object
};

module.exports = Viz;
