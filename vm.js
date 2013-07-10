jQuery(function($){
'use strict';
(function () {

	var config = {
		type		: 'web',
		append		: false,
		perPage		: 8,			// A maximum of 8 is allowed by Google
		page		: 0,			// The start page
		siteURL		: ''
	};
	var viewTypeData=false; // тип строки поиска для показа с результатом поиска?
	var timerHelpUsr=0;
	var helpViewUsr=false; // подсказка показывается пользователю?
	var srcLineFocus=true; // строка ввода запроса в фокусе? (по умолчанию на #s установлен "autofocus")
	var sourceResData=false; // результат поиска

	var cursor=0;
	var sttngs={};
	
	
	
	function googleSearch(settings){
		
		// If no parameters are supplied to the function,
		// it takes its defaults from the config object above:
		
		settings = $.extend({},config,settings);
		settings.term = settings.term || $('#s').val();

		if(settings.siteURL!=''){
            // Using the Google site:example.com to limit the search to a specific domain:
            settings.term = 'site:'+settings.siteURL+' '+settings.term;
        }

        console.log("s="+settings.term);

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

				sourceResData=true;

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

				$('.webResult').find('.srcThisSite').on('click',function(){
					var el = $(this);
					var goSiteUrl=el.attr('gourl');
					console.log("goSiteUrl="+goSiteUrl);
					goSearch({siteURL:goSiteUrl});
					return false;
				});

				$('.webResult').on('click',function(){
					var el = $(this);
					window.open(el.attr('gourl'),'_blank'); 
					return false;
				});

				$('.webResult').hover(function(){
					var el = $(this);
					el.find('.srcThisSite').css('display','block'); 
					//return false;
				},function(){
					var el = $(this);
					el.find('.srcThisSite').css('display','none'); 
				});
			
			} else {
				// No results were found for this search.
				sourceResData=false;
				resultsDiv.empty();
				$('<p>',{className:'notFound',html:'No Results Were Found!'}).hide().appendTo(resultsDiv).fadeIn();
			}
		});
	}
	
	function result(r){
		var arr = [];

		var widthObj=400;
		arr = [
			'<li class="webResult" gourl="',r.unescapedUrl,'">',
			//'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.visibleUrl,'">',
			'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.unescapedUrl,'">',
			'<div class="infSrc">',
			'<img src="http://',r.visibleUrl,'/favicon.ico" class="ico">',
			'<h2><a href="',r.unescapedUrl,'" target="_blank">',r.title,'</a></h2>',
			'<p>',r.content,'</p>',
			'<a href="',r.unescapedUrl,'" target="_blank">',r.visibleUrl,'</a>',
			'<p class="srcThisSite" gourl="',r.visibleUrl,'" title="искать на этом сайте">','искать тут >','</p>',
			'</div>',
			'</li>'
		];
		
		// The toString method.
		this.toString = function(){
			return arr.join('');
		}
	}

	function goSearch(dataSearch) {
		if($('#s').val()!='') {
			// clear list
			$('#resultsDiv').html('');
			$('#searchForm').removeClass('cn fix').addClass('fix');
			$('#clearButton').css('display','block');
			$("#logosrch").css('display','none');
			viewTypeData=true;
			hideHelp();

			googleSearch(dataSearch);
		}
	}

	function hideHelp() {
		helpViewUsr=false;
		timerHelpUsr=0;
		$('.help_left p').hide();
		$('.help_left small').hide();
		$('.help_right p').hide();
		$('.help_right small').hide();

		$('#blackfonscreen').hide();
		if(viewTypeData) {
			$('#blackfonscreen').css('z-index','1050');
			$('#thelist li').css('z-index','1');
		}
	}

	setInterval(function(){
		if(!viewTypeData & !helpViewUsr) {
			timerHelpUsr++;

			// через 20сек. показываем пользователю подсказки
			if(timerHelpUsr>20) {
				helpViewUsr=true;
				timerHelpUsr=0;
				if($('#s').val()!='') {
					// Что-то ввели
					if(srcLineFocus) {
						// предлогаем нажать клавишу enter или по синей кнопке со стрелочкой ">"
						$('.help_right small').html('нажмите клавишу "Enter &#x23ce;" или синию кнопку со стрелкой ">", для поиска по запросу');
						$('.help_right p').show("slow");
						$('.help_right small').show("slow");
					} else {
						// предлогаем нажать по синей кнопке со стрелочкой ">"
						$('.help_right small').html('нажмите синию кнопку со стрелкой ">", для поиска по запросу');
						$('.help_right p').show("slow");
						$('.help_right small').show("slow");
					}
				} else {
					// Не ввели ни чего
					if(srcLineFocus) {
						// предлогаем набрать текст запроса
						$('.help_left small').html('(1) - сформулируйте свой запрос и введите сюда');
						$('.help_right small').html('(2) - нажмите синию кнопку со стрелкой ">" для поиска по запросу или клавишу "Enter &#x23ce;"');
						$('.help_left p').show("slow");
						$('.help_left small').show("slow",function(){
							$('.help_right p').show("slow");
							$('.help_right small').show("slow");
						});
					} else {
						// предлогаем нажать на строку поиска и набрать текст
						$('.help_left small').html('нажмите на строку поиска и введите сюда свой запрос');
						$('.help_left p').show("slow");
						$('.help_left small').show("slow");
					}
				}
			}

		} /*
		-----------------------------------------
		FIXME: прикрыл временно для дебага
		-----------------------------------------
		else if(viewTypeData & !helpViewUsr & sourceResData) {
			timerHelpUsr++;

			// через 40сек. показываем пользователю подсказку №1
			if(timerHelpUsr>40) {
				helpViewUsr=true;
				timerHelpUsr=0;

				$('#blackfonscreen').show();
			}
		} else if(viewTypeData & helpViewUsr & sourceResData) {
			// через 15сек. показываем пользователю подсказку №2
			if(timerHelpUsr>15) {
				$('#blackfonscreen').css('z-index','3050');
				$('#thelist li:first').css('z-index','3060');
			} else {
				timerHelpUsr++;
			}
		}*/
	}, 1000); // 1sec

	setTimeout(function(){
		$('#logosrch small').show("slow");
	}, 5000); // 5sec

	$('#s').bind('keyup',function(){
		hideHelp();
	});

	$('#s').focus(function(){
		srcLineFocus=true;
		hideHelp();
	});
	$('#s').blur(function(){
		srcLineFocus=false;
		hideHelp();
	});

	$('#s').bind('keyup',function(){
		hideHelp();
	});

	$('#page').mouseup(function(){
		hideHelp();
	});

	$('#page').scroll(function(){
		hideHelp();
		if ($('#page').scrollTop() == $('#resultsDiv').height() - $('#page').height()){
			if( +cursor.estimatedResultCount > (sttngs.page+1)*sttngs.perPage){
				googleSearch({append:true,page:sttngs.page+1,siteURL:sttngs.siteURL});
			}
		}
	});

	$('#blackfonscreen').mouseup(function(){
		hideHelp();
	});

	$('#blackfonscreen').scroll(function(){
		hideHelp();
	});

	$('#searchForm').submit(function(){
		if(sttngs) {
			if(sttngs.siteURL!='') {
				goSearch({siteURL:sttngs.siteURL});
			} else {
				goSearch();
			}
		} else {
			goSearch();
		}
		return false;
	});

	$('#clearButton').click(function(){
		$('#resultsDiv').html('');
		$('#clearButton').css('display','none');
		$("#s").val('');
		$("#logosrch").css('display','block');
		$('#searchForm').removeClass('cn fix').addClass('cn');
		viewTypeData=false;
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
		if(params.site) {
			$("#leftSrcTrg").html('<img src="http://'+params.site+'/favicon.ico" class="ico" style="margin:2px;">');
			goSearch({siteURL:params.site});
		} else {
			goSearch();
		}
	}


}());
});