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
        ':year/:edition': 'read',
		'*path': 'defaultRoute'
    },
    read: function(year, edition) {
        var ed = _.find(DevList.Data.Editions, function (e) {
                return e.year == year && e.index == edition;
            });
        DevList.Views.MainMenu.setCurrentEdition(ed.url, ed.title);
        DevList.Models.CurrentEdition.fetch();
    },
	defaultRoute: function (path){
		if (!DevList.Models.CurrentEdition.attributes.url){
			var edition = _.last(DevList.Data.Editions);
			DevList.Views.MainMenu.setCurrentEdition(edition.url, edition.title);
			DevList.Models.CurrentEdition.fetch();
		}
	}
});

DevList.App._Models.Pager = Backbone.Model.extend({
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

DevList.App._Views.Pager = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        _.bindAll(this, 'pagerClick');
        this.model.bind("change", this.render);
    },
    render: function () {
        this.$el.html(DevList.Templates.Pager.render(this.model.toJSON()));
        return this;
    },
    events: {
        'click a': 'pagerClick'
    },
    pagerClick: function (event) {
        var fileName = $(event.target).data('file-name');
        var title = $(event.target).data('title');
        var fileNameNoExtension = fileName.split('.')[0];
        var year = fileNameNoExtension.split('_')[0];
        var edition = fileNameNoExtension.split('_')[1];
        DevList.Views.MainMenu.setCurrentEdition(fileName, title);
        DevList.Models.CurrentEdition.fetch();
    }
});


DevList.App._Views.Edition = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.model.bind("change:links change:title", this.render);
    },
    render: function () {
        this.$el.html(DevList.Templates.Edition.render({ edition: this.model.toJSON() }));
        var prevUrl = '';
        var nextUrl = '';
        var prevTitle = '';
        var nextTitle = '';

		if (this.model.attributes.url) {
			var fileName = this.model.attributes.url.split('/')[2];
			var fileNameNoExtension = fileName.split('.')[0];
			var year = fileNameNoExtension.split('_')[0];
			var edition = fileNameNoExtension.split('_')[1];
			
			var currentEdition = _.find(DevList.Data.Editions, function (e) {
				return e.year == year && e.index == edition;
			});
			var currentIndex = _.indexOf(DevList.Data.Editions, currentEdition);
			var prevDisabled = currentIndex == 0;
			var nextDisabled = (currentIndex + 1) == DevList.Data.Editions.length;

			var prevEdition;
			var nextEdition;

			if (!prevDisabled) {
				prevEdition = DevList.Data.Editions[currentIndex - 1];
				prevUrl = prevEdition.url;
				prevTitle = prevEdition.title;
			}

			if (!nextDisabled) {
				nextEdition = DevList.Data.Editions[currentIndex + 1];
				nextUrl = nextEdition.url;
				nextTitle = nextEdition.title;
			}
			DevList.Models.Search.query  = '';
			DevList.Router.navigate(year + '/' + edition);
			ga('send', 'pageview', year + '/' + edition);
			document.title = 'Dev List - ' + currentEdition.title;
		}
        DevList.Models.Pager.set({ prev_url: prevUrl, next_url: nextUrl, prev_title: prevTitle, next_title: nextTitle });
        return this;
    },
	events: {
        'click div.affiliate a': 'affiliateClick'
    },
	affiliateClick : function(e){
		ga('send', 'event', 'book-affiliate', 'click', $(e.currentTarget.parentElement).parent().find('a.link').text());
	}
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
		_.each(model.changed.years, function(year, index, years) {
            _.each(year.editions, function(edition, idx, list) {
                DevList.Data.Editions.push({ title: edition.title, year: year.year, index: idx + 1, url:edition.url });
            });
        });
		Backbone.history.start();
		this.executeAsync(this.loadLinks);
        return this;
    },
    events: {
        'click a.main-menu-link': 'mainMenuClick'
    },
    setCurrentEdition: function (fileName, title) {
        if (DevList.Models.CurrentEdition) {
            DevList.Models.CurrentEdition.set({ title: title, url: '/json/' + fileName }).url = '/json/' + fileName;
        } else {
            DevList.Models.CurrentEdition = new DevList.App._Models.Edition({ url: '/json/' + fileName, title: title });
        }
    },
    mainMenuClick: function (event) {
        var fileName = $(event.target).data('file-name');
        this.setCurrentEdition(fileName, $(event.target).text());
        DevList.Models.CurrentEdition.fetch();
    },
	executeAsync: function(func) {
		setTimeout(func, 100);
	},
	loadLinks: function() {
		_.each(DevList.Data.Editions, function(edition, index, editions) {
			if (!edition.links){
				$.getJSON( '/json/' + edition.url )
				  .done(function( data ) {
					edition.links = data.links;
				  });
			}
		});
	}
});

DevList.App._Models.Search = Backbone.Model.extend({
    query:''
});

DevList.App._Views.Search = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        _.bindAll(this, 'searchClick');
        this.model.bind("change", this.render);
    },
    render: function () {
        this.$el.html(DevList.Templates.Search.render(this.model.toJSON()));
        return this;
    },
    events: {
        'click button': 'searchClick',
		'keyup #search-box': 'searchType'
    },
    searchClick: function (event) {
		
		var query = $(event.target).parent().find('input').val();
		if (!query) return this;
		var searchResults = [];
		_.each(DevList.Data.Editions, function(ed, index, editions) {
			if (ed.links){
				_.each(ed.links, function(link, index, links) {
					if (link.title.toLowerCase().indexOf(query.toLowerCase()) > -1 || link.description.toLowerCase().indexOf(query.toLowerCase()) > -1){
						searchResults.push(link);
					}
				});	
			}
		});
		DevList.Models.CurrentEdition.set({ issue: '*', url: '', title: 'Search results (' + query + ')', links: searchResults, book: null, freebook: null });
		document.title = 'Dev List search: ' + query;
    },
    searchType: function (event) {
		var query = $(event.target).val();
		if (!query) return this;
		if (query.length < 3) return this;
		var searchResults = [];
		_.each(DevList.Data.Editions, function(ed, index, editions) {
			if (ed.links){
				_.each(ed.links, function(link, index, links) {
					if (link.title.toLowerCase().indexOf(query.toLowerCase()) > -1 || link.description.toLowerCase().indexOf(query.toLowerCase()) > -1){
						searchResults.push(link);
					}
				});	
			}
		});
		DevList.Models.CurrentEdition.set({ issue: '*', url: '', title: 'Search results (' + query + ')', links: searchResults, book: null, freebook: null });
		document.title = 'Dev List search: ' + query;
    }

});

$(function () {
    DevList.Templates.MainMenu = Hogan.compile($('#main-menu-template').text());
	DevList.Templates.Edition = Hogan.compile($('#edition-template').text());
    DevList.Templates.Pager = Hogan.compile($('#pager-template').text());
    DevList.Templates.Search = Hogan.compile($('#search-template').text());
	
	DevList.Models.Years = new DevList.App._Models.Years();
	DevList.Models.Pager = new DevList.App._Models.Pager({ prev_url: '', next_url: '', prev_title: '', next_title: '' });
	DevList.Models.CurrentEdition = new DevList.App._Models.Edition({ url: '', title: '' });
	DevList.Models.Search = new DevList.App._Models.Search({query: ''});
	
	DevList.Views.MainMenu = new DevList.App._Views.MainMenu({ model: DevList.Models.Years, el: '#main-menu' });
	DevList.Views.Edition = new DevList.App._Views.Edition({ model: DevList.Models.CurrentEdition, el: '#edition' });
    DevList.Views.Pager = new DevList.App._Views.Pager({ model: DevList.Models.Pager, el: '#pager' });
	DevList.Views.Search = new DevList.App._Views.Search({ model: DevList.Models.Search, el: '#search-form' });
	
	DevList.Router = new DevList.App._Router();
 
 	DevList.Views.Search.render();
	
    DevList.Models.Years.fetch();
});
