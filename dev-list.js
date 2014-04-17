var DevList = {
    App: {
        _Views: {},
        _Models: {},
        _Collections: {},

    },
    Collections: {},
    Models: {},
    Views: {},
    Data: {},
    Settings: {},
    Templates: {}
};

DevList.App._Models.Years = Backbone.Model.extend({
    url: "/json/index.json"
});

DevList.Data.Years = new DevList.App._Models.Years();

DevList.App._Views.MainMenu = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.model.bind("change reset", this.render);
    },
    render: function () {
        this.$el.html(DevList.Templates.MainMenu.render({ years: this.model.toJSON() }));
        return this;
    },
    events: {
        'click a.main-menu-link': 'mainMenuClick'
    },
    mainMenuClick: function (event) {
        var fileName = $(event.target).data('file-name');
        var fileNameNoExtension = fileName.split('.')[0];
        var year = fileNameNoExtension.split('_')[0];
        var edition = fileNameNoExtension.split('_')[1];
        console.log('Year: ' + year + ', Edition: ' + edition);
    }
});

$(function () {
    DevList.Templates.MainMenu = Hogan.compile($('#main-menu-template').text());
    DevList.Views.MainMenu = new DevList.App._Views.MainMenu({ model: DevList.Data.Years, el: '#main-menu' });
    DevList.Data.Years.fetch();
    //$('#main-menu').html(DevList.Templates.MainMenu.render());
});
