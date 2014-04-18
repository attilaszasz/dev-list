var DevList = {
    App: {
        _Views: {},
        _Models: {},
        _Collections: {},
    },
    Collections: {},
    Models: {},
    Views: {},
    Data: {
        Editions: []
    },
    Settings: {},
    Templates: {}
};

DevList.App._Router = Backbone.Router.extend({
    routes: {
        "read/:year/:edition": "read",
    },
    read: function(year, edition) {
        console.log('year: ' + year + ', edition: ' + edition);
        var ed = _.find(DevList.Data.Editions, function (e) {
                return e.year == year && e.index == edition;
            });

        DevList.Views.MainMenu.setCurrentEdition(ed.url, ed.title);
        DevList.Models.CurrentEdition.fetch();
    },
});

DevList.App._Models.Edition = Backbone.Model.extend({
    initialize: function (props) {
        this.url = props.url;
        this.title = props.title;
    },
    title: function () {
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

DevList.App._Models.Years = Backbone.Model.extend({
    url: "/json/index.json",
});

DevList.App._Views.MainMenu = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        _.bindAll(this, 'menuLoaded');
        _.bindAll(this, 'setCurrentEdition');
        this.model.bind("change", this.menuLoaded);
    },
    render: function () {
        this.$el.html(DevList.Templates.MainMenu.render({ years: this.model.toJSON() }));
        return this;
    },
    menuLoaded: function (model, options) {
        this.render();
        console.log(model.changed);
        _.each(model.changed.years, function(year, index, years) {
            _.each(year.editions, function(edition, idx, list) {
                DevList.Data.Editions.push({ title: edition.title, year: year.year, index: idx + 1, url:edition.url });
            });
        });
        var edition;
        if (Backbone.history.fragment) {
            edition = _.find(DevList.Data.Editions, function (e) {
                return e.year == Backbone.history.fragment.split('/')[1] && e.index == Backbone.history.fragment.split('/')[2];
            });
        } else {
            edition = _.last(DevList.Data.Editions);
        }
        this.setCurrentEdition(edition.url, edition.title);
        DevList.Views.Edition = new DevList.App._Views.Edition({ model: DevList.Models.CurrentEdition, el: '#edition' });
        DevList.Models.CurrentEdition.fetch();
        Backbone.history.start();
        return this;
    },
    events: {
        'click a.main-menu-link': 'mainMenuClick'
    },
    setCurrentEdition: function (fileName, title) {
        console.log('SetCurrentEdition - fileName: ' + fileName + ', title: ' + title);
        if (DevList.Models.CurrentEdition) {
            DevList.Models.CurrentEdition.clear();
            DevList.Models.CurrentEdition.url = '/json/' + fileName;
            DevList.Models.CurrentEdition.set("title", title);
        } else {
            DevList.Models.CurrentEdition = new DevList.App._Models.Edition({ url: '/json/' + fileName, title: title });
        }
    },
    mainMenuClick: function (event) {
        var fileName = $(event.target).data('file-name');
        var fileNameNoExtension = fileName.split('.')[0];
        var year = fileNameNoExtension.split('_')[0];
        var edition = fileNameNoExtension.split('_')[1];
        this.setCurrentEdition(fileName, $(event.target).text());
        DevList.Models.CurrentEdition.fetch();
        DevList.Router.navigate('read/' + year + '/' + edition);
        console.log(Backbone.history.fragment);
    }
});

$(function () {
    DevList.Templates.MainMenu = Hogan.compile($('#main-menu-template').text());
    DevList.Templates.Edition = Hogan.compile($('#edition-template').text());

    DevList.Router = new DevList.App._Router();

    DevList.Models.Years = new DevList.App._Models.Years();
    DevList.Views.MainMenu = new DevList.App._Views.MainMenu({ model: DevList.Models.Years, el: '#main-menu' });
    DevList.Models.Years.fetch();
});
