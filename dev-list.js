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

DevList.App._Router = Backbone.Router.extend({
    routes: {
        "read/:year/:edition": "read",
        "*default": "home"
    },
    read: function(year, edition) {
        console.log('year: ' + year + ', edition: ' + edition);
        if (DevList.Models.CurrentEdition) {
            DevList.Models.CurrentEdition.clear().initialize({ url: '/json/' + year + '_' + edition + '.json', title: 'Test title' });
        } else {
            DevList.Models.CurrentEdition = new DevList.App._Models.Edition({ url: '/json/' + year + '_' + edition + '.json', title: 'Test title' });
        }
        DevList.Models.CurrentEdition.fetch();
    },
    home: function () {
        console.log('home');
        DevList.Models.CurrentEdition = new DevList.App._Models.Edition({ url: '/json/2014_16.json', title: 'Test title' });
        DevList.Models.CurrentEdition.fetch();
        DevList.Router.navigate('read/2014/16', { trigger: false });
    }
});

DevList.App._Models.Years = Backbone.Model.extend({
    url: "/json/index.json"
});

DevList.Models.Years = new DevList.App._Models.Years();

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
        DevList.Models.CurrentEdition.clear().initialize({ url: '/json/' + year + '_' + edition + '.json', title: 'Test title' });
        // DevList.Models.CurrentEdition.instanceUrl = '/json/' + year + '_' + edition + '.json';
        DevList.Models.CurrentEdition.fetch();
        DevList.Router.navigate('read/' + year + '/' + edition, { trigger: false });
    }
});

DevList.App._Models.Edition = Backbone.Model.extend({
    url: function () {
        return this.instanceUrl;
    },
    initialize: function (props) {
        this.instanceUrl = props.url;
        this.title = props.title;
    },
    title: function() {
        return this.title;
    },
});

DevList.App._Views.Edition = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.model.bind("change reset", this.render);
    },
    render: function () {
        this.$el.html(DevList.Templates.Edition.render({ edition: this.model.toJSON() }));
        return this;
    },
});


$(function () {
    DevList.Router = new DevList.App._Router();
    Backbone.history.start({ pushState: true, hashChange: true });
    DevList.Templates.MainMenu = Hogan.compile($('#main-menu-template').text());
    DevList.Templates.Edition = Hogan.compile($('#edition-template').text());
    DevList.Views.MainMenu = new DevList.App._Views.MainMenu({ model: DevList.Models.Years, el: '#main-menu' });
    DevList.Views.Edition = new DevList.App._Views.Edition({ model: DevList.Models.CurrentEdition, el: '#edition' });

    DevList.Models.Years.fetch();
   // DevList.Models.CurrentEdition.fetch();
    //$('#edition').html(DevList.Templates.Edition.render());
});
