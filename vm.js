jQuery(function($){
'use strict';
(function () {

	var lang='ru';
	var lang_def='en';
	var lang_all=['ru','en'];

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

	var i18n={
		'ru':{
			viewma_trn: '&#8592; [вьюма]',
			cnclSrcSite: 'Отменить поиск по сайту',
			entrYInqH: 'Сюда введите свой запрос',
			inpSrcQr: 'Поле ввода запроса для поиска',
			delSrcQr: 'Удалить поисковый запрос',
			srcButton: 'Кнопка поиска',
			goViewUp: 'Наверх к первому результату поиска',
			notFound: 'Ничего не найдено!',
			searchThisSite: 'Поиск по сайту:',
			searchThisSiteM: 'искать на этом сайте',
			helpSrcYFocusY: 'нажмите клавишу "Enter &#x23ce;" или синюю кнопку со стрелкой ">", для поиска по запросу',
			helpSrcYFocusN: 'нажмите синюю кнопку со стрелкой ">", для поиска по запросу',
			helpSrcNFocusY1: '(1) - сформулируйте свой запрос и введите сюда',
			helpSrcNFocusY2: '(2) - нажмите синюю кнопку со стрелкой ">" для поиска по запросу или клавишу "Enter &#x23ce;"',
			helpSrcNFocusN: 'нажмите на строку поиска и введите сюда свой запрос'
		},
		'en':{
			viewma_trn: '&#8592; [vjuːma]',
			cnclSrcSite: 'Cancel Search Site',
			entrYInqH: 'Enter your inquiry here',
			inpSrcQr: 'The input field for the search query',
			delSrcQr: 'To delete a search query',
			srcButton: 'Search button',
			goViewUp: 'Up to the first search result',
			notFound: 'No Results Were Found!',
			searchThisSite: 'Search this site:',
			searchThisSiteM: 'search this site',
			helpSrcYFocusY: 'press "Enter &#x23ce;" or the blue arrow button ">" to search for on request',
			helpSrcYFocusN: 'click the blue arrow button ">" to search for on request',
			helpSrcNFocusY1: '(1) - specify your request and enter here',
			helpSrcNFocusY2: '(2) - press the blue arrow button ">" to search for on-demand, or press "Enter &#x23ce;"',
			helpSrcNFocusN: 'click on the search bar and enter your query here'
		}
	};
	
	
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
					$("#leftSrcTrg_ico").html('<img src="http://'+goSiteUrl+'/favicon.ico" class="ico" style="margin:2px;" title="'+i18n[lang].searchThisSite+' '+goSiteUrl+'">');
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
					if(settings.siteURL==''){
						// только для всех сайтов, а не определенного
						el.find('.srcThisSite').css('display','block'); 
					}
					
				},function(){
					var el = $(this);
					el.find('.srcThisSite').css('display','none'); 
				});
			
			} else {
				// No results were found for this search.
				sourceResData=false;
				resultsDiv.empty();
				$('<p>',{class:'notFound',html:i18n[lang].notFound}).hide().appendTo(resultsDiv).fadeIn();
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
			'<div class="srcThisSite" gourl="',r.visibleUrl,'" title="',i18n[lang].searchThisSiteM,'">','&#8250;','</div>',
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

	function getLocale() {
		if (navigator) {
			if (navigator.language) {
				return navigator.language;
			} else if (navigator.browserLanguage) {
				return navigator.browserLanguage;
			} else if (navigator.systemLanguage) {
				return navigator.systemLanguage;
			} else if (navigator.userLanguage) {
				return navigator.userLanguage;
			}
		}
	}
	function lng(yLng) {
		var now_lang=getLocale().substr(0, 2).toLowerCase();
		if(yLng) {
			now_lang=yLng;
		}
		var ret_lng=lang_def;
		for(var i in lang_all){
			if(lang_all[i]==now_lang) {
				ret_lng=now_lang;
			}
		}
		return ret_lng;
	}

	lang=lng();

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
						$('.help_right small').html(i18n[lang].helpSrcYFocusY);
						$('.help_right p').show("slow");
						$('.help_right small').show("slow");
					} else {
						// предлогаем нажать по синей кнопке со стрелочкой ">"
						$('.help_right small').html(i18n[lang].helpSrcYFocusN);
						$('.help_right p').show("slow");
						$('.help_right small').show("slow");
					}
				} else {
					// Не ввели ни чего
					if(srcLineFocus) {
						// предлогаем набрать текст запроса
						$('.help_left small').html(i18n[lang].helpSrcNFocusY1);
						$('.help_right small').html(i18n[lang].helpSrcNFocusY2);
						$('.help_left p').show("slow");
						$('.help_left small').show("slow",function(){
							$('.help_right p').show("slow");
							$('.help_right small').show("slow");
						});
					} else {
						// предлогаем нажать на строку поиска и набрать текст
						$('.help_left small').html(i18n[lang].helpSrcNFocusN);
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

	
	$('#leftSrcTrg').hover(function(){
		var el = $(this);
		if(sttngs.siteURL!=''){
			$('#leftSrcTrg_close').css('display','block'); 
			$('#leftSrcTrg_ico').css('opacity','.4'); 
		}
	},function(){
		var el = $(this);
		if(sttngs.siteURL!=''){
			$('#leftSrcTrg_close').css('display','none');
			$('#leftSrcTrg_ico').css('opacity','1'); 
		}
	});

	$('#leftSrcTrg_close').click(function(){
		if(sttngs.siteURL!=''){
			$("#leftSrcTrg_ico").html('');
			$('#leftSrcTrg_close').css('display','none');
			$('#leftSrcTrg_ico').css('opacity','1');
			goSearch({siteURL:''});
		}
	});

	$('#goToUp').click(function(){
		$('#page').animate({
          scrollTop: 0
        }, 800);
	});

	$('#page').mouseup(function(){
		hideHelp();
	});

	$('#page').scroll(function(){
		hideHelp();
		var scro=$('#page').scrollTop();
		if(scro>0) {
			$('#goToUp').show("slow");
		} else {
			$('#goToUp').hide();
		}
		if (scro == $('#resultsDiv').height() - $('#page').height()){
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

	if(params.l) {
		lang=lng(params.l);
	}

	
	$('#logosrch small').html(i18n[lang].viewma_trn);
	$('#leftSrcTrg_close').attr('title',i18n[lang].cnclSrcSite);
	$('#s').attr('placeholder',i18n[lang].entrYInqH);
	$('#s').attr('title',i18n[lang].inpSrcQr);
	$('#clearButton').attr('title',i18n[lang].delSrcQr);
	$('#submitButton').attr('title',i18n[lang].srcButton);
	$('#goToUp').attr('title',i18n[lang].goViewUp);

	
	if(params.q) {
		$("#s").val(params.q);
		if(params.site) {
			$("#leftSrcTrg_ico").html('<img src="http://'+params.site+'/favicon.ico" class="ico" style="margin:2px;" title="'+i18n[lang].searchThisSite+' '+params.site+'">');
			goSearch({siteURL:params.site});
		} else {
			goSearch();
		}
	}


}());
});