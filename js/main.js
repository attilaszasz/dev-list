$(document).ready(function (){
	buildPage("https://dl.dropbox.com/s/6ahol5gqhvofcdy/index.json");
});

function buildPage(url)
{
	index = getDataFromSession("index");
	if (index != null) {
		buildMenu(JSON.parse(index));
	} else {	
		$.ajax({
		  url: url + "?callback=?",
		  jsonpCallback: 'indexData',
		  async: false,
		  contentType: "application/json",
		  dataType: 'jsonp',
		  success: function (data) {
			saveDataToSession("index", JSON.stringify(data));
			buildMenu(data);
		  },
		  error: function(e) {
			   console.log(e.message);
		  }
		});		
	}
}

function buildMenu(data)
{
	dropboxhash = "";
	filename = "";
	dropboxhashParam = getParameterByName("dropboxhash");
	filenameParam = getParameterByName("filename");
	title = "";
	$("#HomeLink").text(data.title);
	$.each(data.years, function(indexYears, year) {
		menuFirstPart = "<ul class='nav'><li class='dropdown'><a href='#' class='dropdown-toggle' data-toggle='dropdown'>";
		menuMiddlePart = " <b class='caret'></b></a><ul class='dropdown-menu'><li><ul class='dropdown-menu scroll-menu'>";
		menuLinks = "";
		$.each(year.editions, function(indexEditions, edition) {
			dropboxhash = edition.url.split('/')[4];
			filename = edition.url.split('/')[5];
			if (filenameParam == filename || filenameParam == "") 
			{
				title = edition.title;
				yearIndex = indexYears;
				editionIndex = indexEditions;
			}
			menuLinks += "<li><a href='" + getUrlFromEdition(edition) + "'>" + htmlEncode(edition.title) + "</a></li>";
		});
		menuLastPart = "</ul></li></ul></li></ul>";
		$("#MenuItems>ul:last").after(menuFirstPart + year.year + menuMiddlePart + menuLinks + menuLastPart);
	});
	if (dropboxhashParam != "" && filenameParam != "")
	{
		dropboxhash = dropboxhashParam;
		filename = filenameParam;
	}
	$("#subtitle").text(title);
	$("#PrevLink").attr('href', getPrevLinkUrl(data.years, yearIndex, editionIndex));
	$("#NextLink").attr('href', getNextLinkUrl(data.years, yearIndex, editionIndex));
	$("#PrevLink[href='#'], #NextLink[href='#']").addClass("hidden");
	buildLinks("https://dl.dropbox.com/s/" + dropboxhash + "/" + filename, dropboxhash);
}

function getUrlFromEdition(edition)
{
	var dropboxhash = edition.url.split('/')[4];
	var filename = edition.url.split('/')[5];
	return "index.html?dropboxhash=" + dropboxhash + "&filename=" + filename;
}

function getPrevLinkUrl(years, indexYears, indexEditions)
{
	if (indexYears == 0 && indexEditions == 0) return '#';
	if (indexYears > 0 && indexEditions == 0)
	{
		return getUrlFromEdition(years[indexYears - 1].editions[years[indexYears - 1].editions.length - 1]);
	}
	return getUrlFromEdition(years[indexYears].editions[indexEditions - 1]);
}

function getNextLinkUrl(years, indexYears, indexEditions)
{
	if ((indexYears == (years.length - 1)) && (indexEditions == (years[indexYears].editions.length - 1))) return '#';
	if ((indexYears < (years.length - 1)) && (indexEditions == (years[indexYears].editions.length - 1)))
	{
		return getUrlFromEdition(years[indexYears + 1].editions[0]);
	}
	return getUrlFromEdition(years[indexYears].editions[indexEditions + 1]);
}

function buildLinks(url, dropboxhash)
{
	edition = getDataFromCache(dropboxhash);
	if (edition != null) {
		buildHtml(JSON.parse(edition));
	} else {
		$.ajax({
		  url: url + "?callback=?",
		  jsonpCallback: "data_" + url.split('/')[5].split('.')[0],
		  contentType: "application/json",
		  dataType: 'jsonp',
		  success: function (data) {
			    saveDataToCache(dropboxhash, JSON.stringify(data));
				buildHtml(data);
		  },
		  error: function(e) {
			   console.log(e.message);
		  }
		});		
	}
}

function buildHtml(data)
{
	$.each(data.links, function(index, link) {
		description = '';
		if (link.description != '') { description = "<blockquote class='muted'>" + htmlEncode(link.description) + "</blockquote>"; }
		$("#subtitle~p:last").after("<p>" + ++index + ". <a href='" + link.url + "'>" + htmlEncode(link.title) + "</a>" + description + "</p>");
	});
	
	if (data.freebook)
	{
		if (data.freebook.url == "") {
			bookTitle = "<strong>" + htmlEncode(data.freebook.title) + "</strong>";
		} else {
			bookTitle = "<strong><a href='"+ data.freebook.url + "'>" + htmlEncode(data.freebook.title) + "</a></strong>";
		}
		if (data.freebook.author != "") {
			bookAuthor = " by " + htmlEncode(data.freebook.author);
		} else {
			bookAuthor = "";
		}
		if (data.freebook.links) {
			bookDownloads = "<table><tr><td valign='top'>Download: </td><td>";
			$.each(data.freebook.links, function(index, link) {
				bookDownloads += "<a href='" + link.url + "'>" + htmlEncode(link.name) + "</a><br />";
			});
			bookDownloads += "</td></tr></table>";
		} else {
			bookDownloads = "";
		}
		$("#Books>div:last").after("<div><h4>Free book of the week:</h4><p>" + bookTitle + bookAuthor + "</p>" + bookDownloads + "</div>");
	}
	
	if (data.book)
	{
		if (data.book.url == "") {
			bookTitle = "<strong>" + htmlEncode(data.book.title) + "</strong>";
		} else {
			bookTitle = "<strong><a href='"+ data.book.url + "'>" + htmlEncode(data.book.title) + "</a></strong>";
		}
		if (data.book.author != "") {
			bookAuthor = " by " + htmlEncode(data.book.author);
		} else {
			bookAuthor = "";
		}
		$("#Books>div:last").after("<div><br /><h4>Recommended book of the week:</h4><p>" + bookTitle + bookAuthor + "</p></div>");
	}
}

function getDataFromSession(key)
{
	if(checkSessionStorageSupport) {
		return window.sessionStorage.getItem(key);
	} else return null;
}

function saveDataToSession(key, value)
{
	if(checkSessionStorageSupport) {
		window.sessionStorage.setItem(key, value);
	}
}

function getDataFromCache(key)
{
	if(checkLocalStorageSupport) {
		return window.localStorage.getItem(key);
	} else return null;
}

function saveDataToCache(key, value)
{
	if(checkLocalStorageSupport) {
		window.localStorage.setItem(key, value);
	}
}

function checkLocalStorageSupport() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function checkSessionStorageSupport() {
  try {
    return 'sessionStorage' in window && window['sessionStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function htmlEncode(value){
  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
  //then grab the encoded contents back out.  The div never exists on the page.
  return $('<div/>').text(value).html();
}