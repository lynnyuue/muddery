/*
Muddery map (javascript component)
*/

var map = {
    _map_rooms: {},     // room's key: [room's name, potision]

    _map_exits: {},     // exit's key: [location, destination]

    _map_paths: {},     // room's key: [room's neighbour1,
                        //              room's neighbour2,
                        //              ...]

    _current_location: null,

    clearData: function() {
        this._map_rooms = {};
        this._map_exits = {};
        this._map_paths = {};
    },

    setData: function(data) {
        // set map data
        this._map_rooms = data.rooms;
        this._map_exits = data.exits;

        for (var exit in data.exits) {
            var location = data.exits[exit][0];
            var destination = data.exits[exit][1];
            if (location in this._map_paths) {
                this._map_paths[location].push(destination);
            }
            else {
                this._map_paths[location] = [destination];
            }
        }
    },

    setCurrentLocation: function(location) {
        this._current_location = location;
    },

    revealMap: function(data) {
        // add data to map
        if (!data) {
            return;
        }

        if ("rooms" in data) {
            // add rooms
            for (var room in data.rooms) {
                this._map_rooms[room] = data.rooms[room];
            }
        }

        if ("exits" in data) {
            for (var exit in data.exits) {
                // add exits
                this._map_exits[exit] = data.exits[exit];

                // add paths
                var location = data.exits[exit][0];
                var destination = data.exits[exit][1];
                if (location in this._map_paths) {
                    this._map_paths[location].push(destination);
                }
                else {
                    this._map_paths[location] = [destination];
                }
            }
        }
    },

    showMap: function() {
        var box = $('<div>')
            .attr('id', 'map_box')
            .attr('role', 'dialog')
            .css('display', 'block')
            .addClass('modal')
            .modal({backdrop: "static"})
            .prependTo($("#popup_container"));

        var boxDialog = $('<div>')
            .addClass('modal-dialog modal-lg')
            .addClass('vertical-center')
            .appendTo(box);

        var boxContent = $('<div>')
            .addClass('modal-content')
            .appendTo(boxDialog);

        var boxHeader = $('<div>')
            .addClass('modal-header')
            .appendTo(boxContent);

        boxHeader.append($('<button>')
            .attr('id', 'button_close')
            .attr('type', 'button')
            .attr('data-dismiss', 'modal')
            .attr('onclick', 'popupmgr.doCloseMap()')
            .addClass('close')
            .html('&times;'));

        boxHeader.append($('<h4>')
            .attr('id', 'map_name')
            .text(LS('MAP'))
            .addClass('modal-title'));

        var boxBody = $('<div>')
            .addClass('modal-body')
            .appendTo(boxContent);

        //set size
        var map_width = boxBody.width();
        var map_height = $('#middlewindow').height() * 0.8;

        boxBody.height(map_height);

        if (!(this._current_location &&
            this._current_location in this._map_rooms)){
            // does not have current location, can not show map.
            webclient.doSetPopupSize();
            return;
        }
        var current_room = this._map_rooms[this._current_location];

        //
		var svg = d3.select('#map_box .modal-body')
            .append('svg')
            .attr('id', 'map_svg')
            .attr('width', map_width)
            .attr('height', map_height);

        var scale = settings.map_scale;
        var room_size = settings.map_room_size;
        var origin_x = map_width / 2;
        var origin_y = map_height / 2;

        if (current_room[1]) {
            // set origin point
            origin_x -= current_room[1][0] * scale;
            origin_y -= -current_room[1][1] * scale;
        }

        if (current_room[1] &&
            this._map_paths) {
            // get path positions
            var path_data = [];
            for (var begin in this._map_paths) {
                if (begin in this._map_rooms) {
                    var from = this._map_rooms[begin][1];

                    for (var end in this._map_paths[begin]) {
                        if (this._map_paths[begin][end] in this._map_rooms) {
                            var to = this._map_rooms[this._map_paths[begin][end]][1];

                            if (from && to) {
                                path_data.push([from, to]);  // path posision
                            }
                        }
                    }
                }
            }

            svg.selectAll("line")
                        .data(path_data)
                        .enter()
                        .append("line")
                        .attr("x1",  function(d, i) {
                              return d[0][0] * scale + origin_x;
                              })
                        .attr("y1",  function(d, i) {
                              return -d[0][1] * scale + origin_y;
                              })
                        .attr("x2",  function(d, i) {
                              return d[1][0] * scale + origin_x;
                              })
                        .attr("y2",  function(d, i) {
                              return -d[1][1] * scale + origin_y;
                              })
                        .attr("stroke", "grey")
                        .attr("stroke-width", 2);
        }

        if (this._map_rooms) {
            // get room positions
            var room_data = [];
            var current_room_index = -1;

            if (current_room[1]) {
                var count = 0;
                for (var key in this._map_rooms) {
                    if (this._map_rooms[key][1]) {
                        room_data.push([util.truncate_string(this._map_rooms[key][0], 10, true),   // room's name
                                        this._map_rooms[key][1]]);     // room's position
                        if (key == this._current_location) {
                            current_room_index = count;
                        }
                        count++;
                    }
                }
            }
            else {
                // does not have current position, only show current room at center.
                room_data.push([util.truncate_string(current_room[0], 10, true),   // room's name
                                [0, 0]]);     // room's position
                current_room_index = 0;
            }

            svg.selectAll("rect")
                .data(room_data)
                .enter()
                .append("rect")
                .attr("x", function(d, i) {
                        return d[1][0] * scale - room_size / 2 + origin_x;
                      })
                .attr("y", function(d, i) {
                        return -d[1][1] * scale - room_size / 2 + origin_y;
                      })
                .attr("width", room_size)
                .attr("height", room_size)
                .attr("stroke", function(d, i) {
                        return (i == current_room_index) ? "white" : "grey";
                      })
                .attr("stroke-width", 2);

            svg.selectAll("text")
                .data(room_data)
                .enter()
                .append("text")
                .attr("x", function(d, i) {
                        return d[1][0] * scale + origin_x;
                      })
                .attr("y", function(d, i) {
                        return -d[1][1] * scale + origin_y;
                      })
                .attr("dy", ".3em")
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "14px")
                .attr("fill", "white")
                .text(function(d) {
                        return text2html.clearTags(d[0]);
                      });
        }

        webclient.doSetPopupSize();
    },

    getExitDirection: function(exit) {
        // get the degree of the path
        // from 0 to 360
        if (!(exit in this._map_exits)) {
            return;
        }

        var location = this._map_exits[exit][0];
        if (!location in this._map_rooms) {
            return;
        }

        var destination = this._map_exits[exit][1];
        if (!destination in this._map_rooms) {
            return;
        }

        var from = this._map_rooms[location][1];
        var to = this._map_rooms[destination][1];

        if (!from || !to) {
            return;
        }

        var dx = to[0] - from[0];
        var dy = to[1] - from[1];
        var degree = null;
        if (dx == 0) {
            if (dy > 0) {
                degree = 90;
            }
            else if (dy < 0) {
                degree = 270;
            }
        }
        else {
            degree = Math.atan(dy / dx) / Math.PI * 180;

            if (dx < 0) {
                degree += 180;
            }
        }

        return degree;
    },

    getDirectionName: function(degree) {
        var direction = "";
        degree = degree - Math.floor(degree / 360) * 360;
        if (degree < 22.5) {
            direction = LS("(E)");
        }
        else if (degree < 67.5) {
            direction = LS("(NE)");
        }
        else if (degree < 112.5) {
            direction = LS("(N)");
        }
        else if (degree < 157.5) {
            direction = LS("(NW)");
        }
        else if (degree < 202.5) {
            direction = LS("(W)");
        }
        else if (degree < 247.5) {
            direction = LS("(SW)");
        }
        else if (degree < 292.5) {
            direction = LS("(S)");
        }
        else if (degree < 337.5) {
            direction = LS("(SE)");
        }
        else {
            direction = LS("(E)");
        }

        return direction;
    },

    getDirectionIndex: function(degree) {
        // index of direction:
        // 0  1  2
        // 6  7  8
        // 12 13 14
        // default direction index is 2

        var direction = 1;
        degree = degree - Math.floor(degree / 360) * 360;
        if (degree < 22.5) {
            direction = 8;
        }
        else if (degree < 67.5) {
            direction = 2;
        }
        else if (degree < 112.5) {
            direction = 1;
        }
        else if (degree < 157.5) {
            direction = 0;
        }
        else if (degree < 202.5) {
            direction = 6;
        }
        else if (degree < 247.5) {
            direction = 12;
        }
        else if (degree < 292.5) {
            direction = 13;
        }
        else if (degree < 337.5) {
            direction = 14;
        }
        else {
            direction = 8;
        }

        return direction;
    },
}