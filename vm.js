jQuery(function($){
'use strict';
(function () {

	var config = {		
		searchSite	: true,
		type		: 'web',
		append		: false,
		perPage		: 8,			// A maximum of 8 is allowed by Google
		page		: 0				// The start page
	};
	var cursor=0;
	var sttngs={};

	setTimeout(function(){
		$('#logosrch small').show("slow");
	}, 3000); // 3sec
	
	function googleSearch(settings){
		
		// If no parameters are supplied to the function,
		// it takes its defaults from the config object above:
		
		settings = $.extend({},config,settings);
		settings.term = settings.term || $('#s').val();

		sttngs=settings;
		
		// URL of Google's AJAX search API
		var apiURL = 'http://ajax.googleapis.com/ajax/services/search/'+settings.type+'?v=1.0&callback=?';
		var resultsDiv = $('#resultsDiv');
		
		$.getJSON(apiURL,{q:settings.term,rsz:settings.perPage,start:settings.page*settings.perPage},function(r){
			
			var results = r.responseData.results;
			$('#more').remove();
			
			if(results.length){
				
				// If results were returned, add them to a pageContainer div,
				// after which append them to the #resultsDiv:

				var pageContainer;

				if($("#thelist").length) {
					pageContainer = $('#thelist');
				} else {
					pageContainer = $('<ul>',{id:'thelist',class:'pageContainer'});
				}
				
				for(var i=0;i<results.length;i++){
					// Creating a new result object and firing its toString method:
					pageContainer.append(new result(results[i]) + '');
				}
				
				
				if(!settings.append){
					resultsDiv.empty();
				}
				
				pageContainer.appendTo(resultsDiv);
				
				cursor = r.responseData.cursor;
				 
				
				/*$('#page').scroll(function(){
					if ($('#page').scrollTop() == $('#resultsDiv').height() - $('#page').height()){
						if( +cursor.estimatedResultCount > (settings.page+1)*settings.perPage){
							googleSearch({append:true,page:settings.page+1});
						}
					}
				});*/
				

				$('.webResult').on('click',function(){
					var el = $(this);
					window.open(el.attr('gourl'),'_blank'); 
					return false;
				});
			
			} else {
				// No results were found for this search.
				resultsDiv.empty();
				$('<p>',{className:'notFound',html:'No Results Were Found!'}).hide().appendTo(resultsDiv).fadeIn();
			}
		});
	}
	
	function result(r){
		var arr = [];

		var widthObj=400;
		arr = [
			'<li class="webResult" style="position:relative;float:left;" gourl="',r.unescapedUrl,'">',
			//'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.visibleUrl,'">',
			'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.unescapedUrl,'">',
			'<div class="infSrc">',
			'<h2><a href="',r.unescapedUrl,'" target="_blank">',r.title,'</a></h2>',
			'<p>',r.content,'</p>',
			'<a href="',r.unescapedUrl,'" target="_blank">',r.visibleUrl,'</a>',
			'</div>',
			'</li>'
		];
		
		// The toString method.
		this.toString = function(){
			return arr.join('');
		}
	}

	function goSearch() {
		if($('#s').val()!='') {
			// clear list
			$('#resultsDiv').html('');
			$('#searchForm').removeClass('cn fix').addClass('fix');
			$('#clearButton').css('display','block');
			$("#logosrch").css('display','none');

			googleSearch();
		}
	}

	$('#page').scroll(function(){
		if ($('#page').scrollTop() == $('#resultsDiv').height() - $('#page').height()){
			if( +cursor.estimatedResultCount > (sttngs.page+1)*sttngs.perPage){
				googleSearch({append:true,page:sttngs.page+1});
			}
		}
	});

	$('#searchForm').submit(function(){
		goSearch();
		return false;
	});

	$('#clearButton').click(function(){
		$('#resultsDiv').html('');
		$('#clearButton').css('display','none');
		$("#s").val('');
		$("#logosrch").css('display','block');
		$('#searchForm').removeClass('cn fix').addClass('cn');
	});

	// parse url path..
	var prmstr = window.location.search.substr(1);
	var prmarr = prmstr.split ("&");
	var params = {};

	for ( var i = 0; i < prmarr.length; i++) {
		var tmparr = prmarr[i].split("=");
		params[tmparr[0]] = tmparr[1];
	}
	
	if(params.q) {
		$("#s").val(params.q);
		goSearch();
	}


}());
});