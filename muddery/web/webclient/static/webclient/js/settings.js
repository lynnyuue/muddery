
var settings = {
    // default values
    // language file's pathname
    language: '',

    // map settings
    map_room_size: 40,

    map_scale: 75,

    // command box
    show_command_box: false,

    // can close dialogue box
    can_close_dialogue: false,
    
    // game title
    game_title: '',
    
    // resource location
    resource_location: window.location.protocol + "//" + window.location.host,

    set: function(values) {
        for (var key in values) {
            this[key] = values[key];
        }

        if (this.show_command_box) {
            $("#item_command").css("display", "");
        } else {
            $("#item_command").css("display", "none");
        }

        if (this.game_title) {
            $("#game_title").text(this.game_title);
        }
    },
};