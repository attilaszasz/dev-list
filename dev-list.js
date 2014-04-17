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
        var html = DevList.Templates.MainMenu.render({ years: this.model.toJSON() });
        this.$el.html(html);
        return this;
    },
});

$(function () {
    DevList.Templates.MainMenu = Hogan.compile($('#main-menu-template').text());
    DevList.Views.MainMenu = new DevList.App._Views.MainMenu({ model: DevList.Data.Years, el: '#main-menu' });
    DevList.Data.Years.fetch();
    //$('#main-menu').html(DevList.Templates.MainMenu.render());
});
