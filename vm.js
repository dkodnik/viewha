jQuery(function($){
'use strict';
(function () {
	
	var lang_def='en';
	var lang_all=['ru','en'];

	// настройки котороые будут сохранены в браузере (cookie)
	var sSettings ={
		lang: '', // язык en|ru
		vHelp: 'yes', // показывать подсказки
		firstStrt: 0, // дата первого запуска
		vTileList: 'tile', // представление результат: плитка(tile) или список(list)
		style: 'dark', // стиль темный(dark) или светлый(light)
		styleMap: 'light', // стиль карты темный(dark) или светлый(light)
		urlBckgrndImg: '', // URL - фонового изображения
		searchType: { // тип поиска
			web:true,
			img:true,
			news:true,
			video:true,
			map:true
		}
	};
	if($.cookie('vhSettings')) {
		sSettings = JSON.parse($.cookie('vhSettings'));
	}

	if(sSettings.style=='light') {
		/*$('#blackfonscreen').css('background-color','#fff');*/
		$('#goToUp').css('color','#444');
		$('#backgroundfont1').addClass('light');
		$('#logosrch').addClass('light');
		$('.searchForm-shadow').addClass('light');
		$('#leftSrcTrg').addClass('light');
		$('#clearButton').addClass('light');
		$('#submitButton').addClass('light');
		$('#s').addClass('light');
	}

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
	var sourceResDataEnd=false; // это конец(последний) результат поиска

	var map;  // for Map-LeafletJS

	var cursor=0;
	var sttngs={};

	/* ==================== START FUNCTIONS ===================== */
	
	function playThisAudio(val) {
    		var txtUrl="http://translate.google.com/translate_tts?ie=utf-8&tl="+lang_def+"&q=";
    		var myAudio = document.getElementById('vmAu');
    		var tuv=txtUrl+val;
    		console.log('speech='+tuv);
    		myAudio.setAttribute('src', tuv);
    		myAudio.setAttribute('preload', 'auto');
    		myAudio.play();
	}

	function drawMap(idObj,c_lat,c_lng) {
		var cmAttr = '',
			cmUrl = '';

		if(sSettings.styleMap=='dark') {
			cmUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png';
		} else if(sSettings.styleMap=='light') {
			cmUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
		}

		var midnight  = L.tileLayer(cmUrl, {styleId: 999,   attribution: cmAttr});

		map = L.map(idObj, {
			center: [c_lat, c_lng],
			zoom: 14,
			zoomControl: false, // Скрываем кнопки упрвеления картой (false)
			attributionControl: false, // Скрываем стандартный атрибут о карте
			layers: [midnight],
			trackResize: true
		});
		L.control.attribution({prefix:''/*'Права'*/}).addTo(map); //'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'

		// add a marker in the given location, attach some popup content to it and open the popup
		/*L.marker([oner.geometry.location.lat, oner.geometry.location.lng]).addTo(map)
			.bindPopup('A pretty CSS3 popup. <br> Easily customizable.')
			.openPopup();*/
	}

	function googleMap(qre) {
		if(sSettings.searchType.map) {
		var resultsDiv = $('#resultsDiv');
		var apiURL = 'https://maps.googleapis.com/maps/api/geocode/json';
		$.getJSON(apiURL,{address:qre,language:sSettings.lang,sensor:false},function(r){
			if(r.status=="OK") {
				var rsl=r.results;

				// FIXME: Нужно "map" контейнер как для "pageContainer"(стр.76-80), иначе задваивается #map
				console.log('su='+sttngs.siteURL);

				if(sttngs.siteURL!='#map') {

				var pageContainer;

				if($("#thelist").length) {
					pageContainer = $('#thelist');
				} else {
					var classViewResSearch='pageContainer';
					if(sSettings.vTileList=='list') {
						classViewResSearch+=' reSline';
					}
					pageContainer = $('<ul>',{id:'thelist',class:classViewResSearch});
				}
				
				pageContainer.appendTo(resultsDiv);

				if(rsl.length>0) {
					/*for (var i in rsl) {
						var oner=rsl[i];
					}*/

					var oner=rsl[0];
					
					var htmlEndForm='';
					htmlEndForm='<li class="webResultMap" gourl="" style="cursor:default;">';
					htmlEndForm+='<div class="cntnt">';
					htmlEndForm+='<div id="map" tabindex="0"></div>';
					htmlEndForm+='<div class="infSrc">';
					htmlEndForm+='<div class="isD">';
					htmlEndForm+='<div class="markerResSrc"><i class="icon-map-marker icon-2x"></i></div>';
					htmlEndForm+='<img src="http://www.openstreetmap.org/favicon.ico" class="ico">';
					htmlEndForm+='<p>'+oner.formatted_address+'</p>';
					htmlEndForm+='<div class="srcThisSite" gourl="" original-title="<font class=\'fs15\'>'+i18n[sSettings.lang].searchMapSiteM+'</font>">'+'&#8250;'+'</div>';
					htmlEndForm+='</div>';
					htmlEndForm+='</div></div>';
					htmlEndForm+='</li>';
					
					$('#thelist').append(htmlEndForm);
					
					$('.webResultMap').find('.srcThisSite').on('click',function(){
						var el = $(this);
						var goSiteUrl=el.attr('gourl');
						
						$('<div>',{id:'map_full',class:'',style:'width:100%;height:100%;position:fixed;top:0;left:0;'}).appendTo($('#page'));
						resultsDiv.empty();
						console.log("goSiteUrl=Map");
						$("#leftSrcTrg_ico").html('<img src="http://www.openstreetmap.org/favicon.ico" class="ico" style="margin:4px 2px;" title="'+i18n[sSettings.lang].searchThisSite+' Map">');
						sttngs.siteURL='#map';

						drawMap('map_full',oner.geometry.location.lat, oner.geometry.location.lng);

						return false;
					});

					$('.webResultMap').find('.srcThisSite').tipsy({html:true, gravity:'se', delayIn:700, delayOut:200});

					$('.webResultMap').hover(function(){
						var el = $(this);
						el.find('.srcThisSite').css('display','block'); 
					},function(){
						var el = $(this);
						el.find('.srcThisSite').css('display','none');
					});

					drawMap('map',oner.geometry.location.lat, oner.geometry.location.lng);

				}

				} else {
					if(rsl.length>0) {
						var oner=rsl[0];
						map.setView(new L.LatLng(oner.geometry.location.lat, oner.geometry.location.lng),14);
					}
				}
				
			}
		});
		}
	}
	
	
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

		var typeGglQ=[];
		if(sSettings.searchType.web) typeGglQ.push('web');
		if(sSettings.searchType.img) typeGglQ.push('images');
		if(sSettings.searchType.news) typeGglQ.push('news');
		if(sSettings.searchType.video) typeGglQ.push('video');

		for(var istpGQ in typeGglQ) {

		// URL of Google's AJAX search API
		var apiURL = 'http://ajax.googleapis.com/ajax/services/search/'+typeGglQ[istpGQ]+'?v=1.0&callback=?';
		var resultsDiv = $('#resultsDiv');
		
		$.getJSON(apiURL,{q:settings.term,rsz:settings.perPage,start:settings.page*settings.perPage},function(r){
			
			if(r.responseData) {
			var results = r.responseData.results;
			
			if(results.length){
				
				// If results were returned, add them to a pageContainer div,
				// after which append them to the #resultsDiv:

				sourceResData=true;

				var pageContainer;

				if($("#thelist").length) {
					pageContainer = $('#thelist');
				} else {
					var classViewResSearch='pageContainer';
					if(sSettings.vTileList=='list') {
						classViewResSearch+=' reSline';
					}
					pageContainer = $('<ul>',{id:'thelist',class:classViewResSearch});
				}
				
				for(var i=0;i<results.length;i++){
					// Creating a new result object and firing its toString method:
					pageContainer.append(new result(results[i]) + '');
				}
				
				
				/*if(!settings.append){
					resultsDiv.empty();
				}*/
				
				pageContainer.appendTo(resultsDiv);
				
				cursor = r.responseData.cursor;

				$('.webResult').find('.srcThisSite').off(); // удаляем все заранее установленные обработчики событий
				$('.webResult').find('.speechThisSite').off(); // удаляем все заранее установленные обработчики событий
				$('.webResult').find('.srcThisSite').on('click',function(){
					var el = $(this);
					//el.tipsy({live:true,html:true, gravity:'se', delayIn:700, delayOut:200});
					var goSiteUrl=el.attr('gourl');
					console.log("goSiteUrl="+goSiteUrl);
					$("#leftSrcTrg_ico").html('<img src="http://'+goSiteUrl+'/favicon.ico" class="ico" style="margin:4px 2px;" title="'+i18n[sSettings.lang].searchThisSite+' '+goSiteUrl+'">');
					goSearch({siteURL:goSiteUrl});
					return false;
				});
				$('.webResult').find('.speechThisSite').on('click',function(){
					var el = $(this);
					var spchTxt=el.attr('spchtxt');
					console.log("spchTxt="+spchTxt);
					playThisAudio(spchTxt);
					//return false;
				});

				$('.webResult').find('.srcThisSite').tipsy({html:true, gravity:'se', delayIn:700, delayOut:200});
				$('.webResult').find('.speechThisSite').tipsy({html:true, gravity:'se', delayIn:700, delayOut:200});


				$('.webResult').off(); // удаляем все заранее установленные обработчики событий
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
						el.find('.speechThisSite').css('display','block');
					}
					// zoomer - on					
					var idST=setTimeout(function(){
						el.css('z-index','20');
						el.find('.cntnt').removeClass('zoom').addClass('zoom');
					}, 3000); // 3sec
					el.attr('timeZoom',idST);
				},function(){
					var el = $(this);
					// zoomer - off
					el.css('z-index','10');
					el.find('.cntnt').removeClass('zoom');
					if(el.attr('timeZoom')!=0) {
						clearTimeout(el.attr('timeZoom'));
						el.attr('timeZoom',0);
					}
					
					el.find('.srcThisSite').css('display','none');
					el.find('.speechThisSite').css('display','none');
				});
			
			} else {
				// No results were found for this search.
				// FIXME: vvv
				/*sourceResData=false;
				resultsDiv.empty();
				$('<p>',{class:'notFound',html:i18n[sSettings.lang].notFound}).hide().appendTo(resultsDiv).fadeIn();*/
			}
			}
		});
		}
	}

	function result_end(){
		if(!sourceResDataEnd) {
			var htmlEndForm='<li class="webResult" gourl="" style="cursor:default;"><div class="cntnt" style="padding:10px;">';
			htmlEndForm+='<h2>'+i18n[sSettings.lang].otherSrcEng+'</h2>';
			htmlEndForm+='<a href="https://www.google.com/search?q='+$('#s').val()+'" target="_blank" style="font-size:15px;"><img src="https://www.google.com/favicon.ico" class="ico" style="margin: 0 15px;"> Google</a><br /><br />';
			htmlEndForm+='<a href="http://www.yandex.com/yandsearch?text='+$('#s').val()+'" target="_blank" style="font-size:15px;"><img src="http://www.yandex.ru/favicon.ico" class="ico" style="margin: 0 15px;"> Yandex</a><br /><br />';
			htmlEndForm+='<a href="http://www.bing.com/search?q='+$('#s').val()+'" target="_blank" style="font-size:15px;"><img src="http://www.bing.com/favicon.ico" class="ico" style="margin: 0 15px;"> Bing</a><br /><br />';
			htmlEndForm+='<a href="http://www.wolframalpha.com/input/?i='+$('#s').val()+'" target="_blank" style="font-size:15px;"><img src="http://www.wolframalpha.com/favicon.ico" class="ico" style="margin: 0 15px;"> WolframAlpha</a>';
			htmlEndForm+='</div></li>';
			$('#thelist').append(htmlEndForm);
		}
	}
	
	function result(r){
		var arr = [];

		var widthObj=400;

		// GsearchResultClass is passed by the google API
		switch(r.GsearchResultClass){
			case 'GwebSearch':
				arr = [
					'<li class="webResult" gourl="',r.unescapedUrl,'">',
					'<div class="cntnt">',
					//'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.visibleUrl,'">',
					'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.unescapedUrl,'" class="img" />',
					'<div class="infSrc">',
					'<div class="isD">',
					'<div class="markerResSrc"><i class="icon-file-text-alt icon-2x"></i></div>',
					'<img src="http://',r.visibleUrl,'/favicon.ico" class="ico">',
					'<h2><a href="',r.unescapedUrl,'" target="_blank">',r.title,'</a></h2>',
					'<p>',r.content,'</p>',
					'<a href="',r.unescapedUrl,'" target="_blank">',r.visibleUrl,'</a>',
					'<div class="speechThisSite" spchtxt="',r.title,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchSpeechText+'</font>','">','<i class="icon-volume-up"></i>','</div>',
					'<div class="srcThisSite" gourl="',r.visibleUrl,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchThisSiteM+'</font>','">','&#8250;','</div>',
					'</div>',
					'</div>',
					'</div>',
					'</li>'
				];
				break;
			case 'GimageSearch':
				arr = [
					'<li class="webResult" gourl="',r.unescapedUrl,'">',
					'<div class="cntnt">',
					//'<img src="',r.tbUrl,'" width="',r.tbWidth,'px" height="',r.tbHeight,'px" />',
					'<img src="',r.unescapedUrl,'" class="img" />',
					'<div class="infSrc">',
					'<div class="isD">',
					'<div class="markerResSrc"><i class="icon-picture icon-2x"></i></div>',
					'<img src="http://',r.visibleUrl,'/favicon.ico" class="ico">',
					'<p>',r.titleNoFormatting,'</p>',
					'<a href="',r.originalContextUrl,'" target="_blank">',r.visibleUrl,'</a>',
					'<div class="speechThisSite" spchtxt="',r.title,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchSpeechText+'</font>','">','<i class="icon-volume-up"></i>','</div>',
					'<div class="srcThisSite" gourl="',r.visibleUrl,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchThisSiteM+'</font>','">','&#8250;','</div>',
					'</div>',
					'</div>',
					'</div>',
					'</li>'
				];
				break;
			case 'GvideoSearch':
				var imgHtml='';
				if(r.videoType=='YouTube') {
					var prmarr = r.url.split ("?");
					var params = {};
					for ( var i = 0; i < prmarr.length; i++) {
						var tmparr = prmarr[i].split("=");
						params[tmparr[0]] = tmparr[1];
					}
					imgHtml='<img src="http://img.youtube.com/vi/'+params.v+'/hqdefault.jpg" class="img" />';
				} else {
					imgHtml='<img src="'+r.tbUrl+'" width="100%" class="img" />';
				}
				arr = [
					'<li class="webResult" gourl="',r.url,'">',
					'<div class="cntnt">',
					imgHtml,
					'<div class="infSrc">',
					'<div class="isD">',
					'<div class="markerResSrc"><i class="icon-film icon-2x"></i></div>',
					'<img src="http://',r.publisher,'/favicon.ico" class="ico">',
					'<h2>',r.videoType,'</h2>',
					'<p>',r.titleNoFormatting,'</p>',
					'<a href="',r.originalContextUrl,'" target="_blank">',r.publisher,'</a>',
					'<div class="speechThisSite" spchtxt="',r.title,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchSpeechText+'</font>','">','<i class="icon-volume-up"></i>','</div>',
					'<div class="srcThisSite" gourl="',r.publisher,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchThisSiteM+'</font>','">','&#8250;','</div>',
					'</div>',
					'</div>',
					'</div>',
					'</li>'
				];
				break;
			case 'GnewsSearch':
				var hostU=parseURL(r.unescapedUrl).host;
				arr = [
					'<li class="webResult" gourl="',r.unescapedUrl,'">',
					'<div class="cntnt">',
					'<img src="http://mini.s-shot.ru/1024x768/',widthObj,'/jpeg/?',r.unescapedUrl,'" class="img" />',
					'<div class="infSrc">',
					'<div class="isD">',
					'<div class="markerResSrc"><i class="icon-rss icon-2x"></i></div>',
					'<img src="http://',hostU,'/favicon.ico" class="ico">',
					'<h2><a href="',r.unescapedUrl,'" target="_blank">',r.title,'</a></h2>',
					'<p>',r.content,'</p>',
					'<a href="',r.unescapedUrl,'" target="_blank">',r.publisher,'</a>',
					'<div class="speechThisSite" spchtxt="',r.title,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchSpeechText+'</font>','">','<i class="icon-volume-up"></i>','</div>',
					'<div class="srcThisSite" gourl="',hostU,'" original-title="','<font class=\'fs15\'>'+i18n[sSettings.lang].searchThisSiteM+'</font>','">','&#8250;','</div>',
					'</div>',
					'</div>',
					'</div>',
					'</li>'
				];
				break;
		}
		
		// The toString method.
		this.toString = function(){
			return arr.join('');
		}
	}

	function parseURL(url) {
		var ths={};
        url = url || ths.href;
        var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
        var rx = new RegExp(pattern); 
        var parts = rx.exec(url);
        
        ths.href = parts[0] || "";
        ths.protocol = parts[1] || "";
        ths.host = parts[4] || "";
        ths.hostname = parts[5] || "";
        ths.port = parts[6] || "";
        ths.pathname = parts[7] || "/";
        ths.search = parts[8] || "";
        ths.hash = parts[10] || "";
        
        return ths;
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

			window.location.hash = "q="+$('#s').val();

			var dSsiteURL=false;
			if(dataSearch) {
				if(dataSearch.siteURL!='#map' & dataSearch.siteURL!='' & dataSearch.siteURL!="" & dataSearch.siteURL!=undefined) {
					dSsiteURL=true;
				}
			}
			if((sttngs.siteURL!='#map' & sttngs.siteURL!='' & sttngs.siteURL!="" & sttngs.siteURL!=undefined) | dSsiteURL) {
				window.location.hash = "q="+$('#s').val()+":site="+dataSearch.siteURL;
			} else {
				if(sttngs.siteURL=='#map') {
					window.location.hash = "q="+$('#s').val()+":site=map";
				} else {
					//window.location.hash = "q="+$('#s').val()+":site?="+dataSearch.siteURL;
				}
			}
			
			googleMap($('#s').val());

			if(sttngs.siteURL!='#map') {
				googleSearch(dataSearch);
			}
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
		/*
		-----------------------------------------
		FIXME: прикрыл временно для дебага
		-----------------------------------------
		if(viewTypeData) {
			$('#blackfonscreen').css('z-index','1050');
			$('#thelist li').css('z-index','10');
		}*/
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

	function showModalWin(htmlBody) {
		$('#winModalBody').html(htmlBody);
		$('#blackfonscreen').show();
		$('#blackfonscreen').removeClass('zIdx3000').addClass('zIdx3000');
		$('#winModal').show();
	}

	function hideModalWin() {
		$('#winModal').hide();
		$('#winModalBody').html('');
		$('#blackfonscreen').hide();
		$('#blackfonscreen').removeClass('zIdx3000');
	}

	/* ==================== END FUNCTIONS ===================== */



	if(sSettings.lang=='') {
		sSettings.lang=lng();
		$.cookie('vhSettings',JSON.stringify(sSettings));
	}

	if(sSettings.firstStrt==0) {
		sSettings.firstStrt=(new Date()).getTime();
		$.cookie('vhSettings',JSON.stringify(sSettings));
	} else {
		var nowDate=(new Date()).getTime();
		// Отключаем подсказки, когда больше 3 дней используется
		if((sSettings.firstStrt+3600*24*3)<nowDate) {
			sSettings.vHelp='no';
			$.cookie('vhSettings',JSON.stringify(sSettings));
		}
	}

	var btnSettings = $('<li>');
	btnSettings.html('<i class="icon-cogs"></i> '+i18n[sSettings.lang].settings);
	btnSettings.click(function(){

		showModalWin(
			'<div id="pageViewStngs" style="padding:20px;">'+
			'<h2>'+i18n[sSettings.lang].stngSearch+'</h2>'+
			'<hr>'+
			''+i18n[sSettings.lang].lang+': '+
			'<select>'+
			'<option value="ru">Русский</option>'+
			'<option value="en">English</option>'+
			'</select>'+
			'<br>'+'<br>'+
			''+i18n[sSettings.lang].helpingView+': '+
			'<input type="radio" name="helpingsite" value="yes"> '+i18n[sSettings.lang].yes+
			'<input type="radio" name="helpingsite" value="no"> '+i18n[sSettings.lang].no+
			'<br>'+'<br>'+
			''+i18n[sSettings.lang].styleSite+': '+
			'<input type="radio" name="stylesite" value="dark"> '+i18n[sSettings.lang].dark+
			'<input type="radio" name="stylesite" value="light"> '+i18n[sSettings.lang].light+
			'<br>'+'<br>'+
			''+i18n[sSettings.lang].styleMap+': '+
			'<input type="radio" name="stylemap" value="dark"> '+i18n[sSettings.lang].dark+
			'<input type="radio" name="stylemap" value="light"> '+i18n[sSettings.lang].light+
			'<br>'+'<br>'+
			''+i18n[sSettings.lang].whereToLook+': <br>'+
			'<input id="stW" type="checkbox" name="first1" /> '+i18n[sSettings.lang].sites+'<br>'+
			'<input id="stI" type="checkbox" name="first2" /> '+i18n[sSettings.lang].images+'<br>'+
			'<input id="stN" type="checkbox" name="first3" /> '+i18n[sSettings.lang].news+'<br>'+
			'<input id="stV" type="checkbox" name="first4" /> '+i18n[sSettings.lang].video+'<br>'+
			'<input id="stM" type="checkbox" name="first5" /> '+i18n[sSettings.lang].map+'<br>'+
			'<br>'+'<br>'+
			''+i18n[sSettings.lang].urlImgBack+': <br>'+
			'<input type="text" id="urlPhonsImg" size="40" style="width:100%;">'+
			'<br>'+'<br>'+
			'<button id="saveSettings">'+i18n[sSettings.lang].save+'</button>'+
			'</div>'
		);

		if(sSettings.lang=='ru') {
			$('#pageViewStngs select option[value=' + 'ru' + ']').attr('selected', 'selected');
		} else if(sSettings.lang=='en') {
			$('#pageViewStngs select option[value=' + 'en' + ']').attr('selected', 'selected');
		}
		
		if(sSettings.vHelp=='yes') {
			$('#pageViewStngs input:radio[name="helpingsite"][value=' + 'yes' + ']').attr('checked', 'checked');
		} else if(sSettings.vHelp=='no') {
			$('#pageViewStngs input:radio[name="helpingsite"][value=' + 'no' + ']').attr('checked', 'checked');
		}

		if(sSettings.style=='dark') {
			$('#pageViewStngs input:radio[name="stylesite"][value=' + 'dark' + ']').attr('checked', 'checked');
		} else if(sSettings.style=='light') {
			$('#pageViewStngs input:radio[name="stylesite"][value=' + 'light' + ']').attr('checked', 'checked');
		}
		if(sSettings.styleMap=='dark') {
			$('#pageViewStngs input:radio[name="stylemap"][value=' + 'dark' + ']').attr('checked', 'checked');
		} else if(sSettings.styleMap=='light') {
			$('#pageViewStngs input:radio[name="stylemap"][value=' + 'light' + ']').attr('checked', 'checked');
		}

		if(sSettings.searchType.web) $('#stW').attr('checked','checked');
		if(sSettings.searchType.img) $('#stI').attr('checked','checked');
		if(sSettings.searchType.news) $('#stN').attr('checked','checked');
		if(sSettings.searchType.video) $('#stV').attr('checked','checked');
		if(sSettings.searchType.map) $('#stM').attr('checked','checked');

		if(sSettings.urlBckgrndImg.length>0) {
			$('#urlPhonsImg').val(sSettings.urlBckgrndImg);
		}
		
		$('#saveSettings').click(function(){
			var selectLang=$('#pageViewStngs select option:selected').val();
			if(selectLang=='ru') {
				sSettings.lang='ru';
			} else if(selectLang=='en') {
				sSettings.lang='en';
			}
			var radioHelp=$('#pageViewStngs input:radio[name="helpingsite"]:checked');
			for(var i=0; i<radioHelp.length;i++) {
				var typeHlp=radioHelp[i].value;
				if(typeHlp=='yes') {
					sSettings.vHelp='yes';
				} else if(typeHlp=='no') {
					sSettings.vHelp='no';
				}
			}
			var radioSite=$('#pageViewStngs input:radio[name="stylesite"]:checked');
			for(var i=0; i<radioSite.length;i++) {
				var typeStl=radioSite[i].value;
				if(typeStl=='dark') {
					sSettings.style='dark';
				} else if(typeStl=='light') {
					sSettings.style='light';
				}
			}
			var radioMap=$('#pageViewStngs input:radio[name="stylemap"]:checked');
			for(var i=0; i<radioMap.length;i++) {
				var typeMap=radioMap[i].value;
				if(typeMap=='dark') {
					sSettings.styleMap='dark';
				} else if(typeMap=='light') {
					sSettings.styleMap='light';
				}
			}
			sSettings.searchType.web=false;
			sSettings.searchType.img=false;
			sSettings.searchType.news=false;
			sSettings.searchType.video=false;
			sSettings.searchType.map=false;
			var checkboxSearch=$('#pageViewStngs input:checkbox:checked');
			for(var i=0; i<checkboxSearch.length;i++) {
				var idCh=$(checkboxSearch[i]).attr('id');
				if(idCh=='stW') {sSettings.searchType.web=true;}
				if(idCh=='stI') {sSettings.searchType.img=true;}
				if(idCh=='stN') {sSettings.searchType.news=true;}
				if(idCh=='stV') {sSettings.searchType.video=true;}
				if(idCh=='stM') {sSettings.searchType.map=true;}
			}
			sSettings.urlBckgrndImg=$('#urlPhonsImg').val();
			
			$.cookie('vhSettings',JSON.stringify(sSettings));
			window.location.reload();
		});
	});
	btnSettings.appendTo($('.nav-list-button'));

	var btnPrivacy = $('<li>');
	btnPrivacy.html('<i class="icon-book"></i> '+i18n[sSettings.lang].terms);
	btnPrivacy.click(function(){
		var txtPrivacy=jQuery.ajax({
            url: './LICENSE',
            async: false
        }).responseText;
        txtPrivacy=txtPrivacy.replace(/\n/gi, '<br>');
		showModalWin(txtPrivacy);
	});
	btnPrivacy.appendTo($('.nav-list-button'));

	

	setInterval(function(){
		if(sSettings.vHelp=='yes') {
		if(!viewTypeData & !helpViewUsr) {
			timerHelpUsr++;

			// через 20сек. показываем пользователю подсказки
			if(timerHelpUsr>20) {
				helpViewUsr=true;
				timerHelpUsr=0;
				if($('#s').val()!='') {
					// Что-то ввели
					$('.autocompl').hide('slow');
					if(srcLineFocus) {
						// предлогаем нажать клавишу enter или по синей кнопке со стрелочкой ">"
						$('.help_right small').html(i18n[sSettings.lang].helpSrcYFocusY);
						$('.help_right p').show("slow");
						$('.help_right small').show("slow");
					} else {
						// предлогаем нажать по синей кнопке со стрелочкой ">"
						$('.help_right small').html(i18n[sSettings.lang].helpSrcYFocusN);
						$('.help_right p').show("slow");
						$('.help_right small').show("slow");
					}
				} else {
					// Не ввели ни чего
					if(srcLineFocus) {
						// предлогаем набрать текст запроса
						$('.help_left small').html(i18n[sSettings.lang].helpSrcNFocusY1);
						$('.help_right small').html(i18n[sSettings.lang].helpSrcNFocusY2);
						$('.help_left p').show("slow");
						$('.help_left small').show("slow",function(){
							$('.help_right p').show("slow");
							$('.help_right small').show("slow");
						});
					} else {
						// предлогаем нажать на строку поиска и набрать текст
						$('.help_left small').html(i18n[sSettings.lang].helpSrcNFocusN);
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
		}
	}, 1000); // 1sec

	setTimeout(function(){
		$('#logosrch small').show("slow");
	}, 5000); // 5sec
	

	$('#s').bind('keyup',function(e){
		var code = e.which;
		
		hideHelp();
		
		// code: 13-enter, 27-escape
		if(code!=13 & code!=27) {
		// Autocomplete Google
		if($('#s').val().length>0) {
			// http://api.bing.com/osjson.aspx?query=
			$.ajax({
				type: 'GET',
				url: 'http://google.com/complete/search',
				crossDomain: true,
				dataType: 'jsonp',
				data: {
					output: 'firefox',
					hl: sSettings.lang,
					q: $('#s').val()
				},
				success: function(obj) {
					if(obj[1] && obj[1].length>0) {
						$('.autocompl').show();
						$('#hlpCompl').empty();
						for(var i in obj[1]) {
							$('#hlpCompl').append('<li class="hlpCompStr">'+(obj[1][i])+'</li>');
						}
						$('.hlpCompStr').on('click',function(){
							var el = $(this);
							$('#s').val(el.text());
							$('.autocompl').hide();
							return false;
						});
					}
				}
			});
		} else {
			$('.autocompl').hide();
		} }
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
		if(sttngs.siteURL && sttngs.siteURL!='') {
			$('#leftSrcTrg_close').css('display','block'); 
			$('#leftSrcTrg_ico').css('opacity','.4'); 
		}
	},function(){
		var el = $(this);
		if(sttngs.siteURL && sttngs.siteURL!='') {
			$('#leftSrcTrg_close').css('display','none');
			$('#leftSrcTrg_ico').css('opacity','1'); 
		}
	});

	$('#leftSrcTrg_close').click(function(){
		if(sttngs.siteURL!=''){
			$("#leftSrcTrg_ico").html('');
			$('#leftSrcTrg_close').css('display','none');
			$('#leftSrcTrg_ico').css('opacity','1');
			if(sttngs.siteURL=='#map') {
				//$("#map").remove();
				$("#map_full").remove();
				sttngs.siteURL='';
			}
			goSearch({siteURL:''});
		}
	});

	$('#goToUp').click(function(){
		$('#page').animate({
          scrollTop: 0
        }, 800);
	});

	$('#winModal_close').click(function(){
		hideModalWin();
	});

	$('#page').mouseup(function(){
		hideHelp();
	});

	$('#page').scroll(function(){
		hideHelp();
		var scro=$('#page').scrollTop();
		if(scro>0) {
			$('.autocompl').hide(); // закрываем, иногда остается открытым за позднего ответа
			$('#goToUp').show("slow");
		} else {
			$('#goToUp').hide();
		}
		if (scro == $('#resultsDiv').height() - $('#page').height()){
			// cursor.estimatedResultCount - количество всего найденных результатов
			if( +cursor.estimatedResultCount > (sttngs.page+1)*sttngs.perPage){
				if(cursor.currentPageIndex<7) { // Ограничения у Google, максимум ответов 64(8*8)
					googleSearch({append:true,page:sttngs.page+1,siteURL:sttngs.siteURL});
				} else {
					result_end();
					sourceResDataEnd=true;
				}
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
		$('.autocompl').hide();
		sourceResDataEnd=false;
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
		window.location.hash = '';
		$('#resultsDiv').html('');
		$('#clearButton').css('display','none');
		$("#s").val('');
		$("#logosrch").css('display','block');
		$('#searchForm').removeClass('cn fix').addClass('cn');
		viewTypeData=false;
		$('.autocompl').hide();
	});

	$('#nav-button').click(function(){
		if($('#layer-body').hasClass('viewMenu')) {
		//if($('#layer-body').attr('class') == 'viewMenu') {
			//$('#layer-body').toggleClass('viewMenu');
			$('#layer-body').animate({'margin-left': '0px'}, 500, 'linear', function() {
				$('#layer-body').removeClass('viewMenu');
			});
			if(sttngs.siteURL=='#map') {
				$("#map_full").animate({'margin-left': '0px'}, 500, 'linear');				
			}
		} else {
			$('#layer-body').animate({'margin-left': '200px'}, 500, 'linear', function() {
				$('#layer-body').addClass('viewMenu');
			});
			if(sttngs.siteURL=='#map') {
				$("#map_full").animate({'margin-left': '200px'}, 500, 'linear');				
			}
		}
		
	});

	// кнопка представления результата поиска (плитка или лист)
	$('#resViewT-button').click(function(){
		$('#resViewL-button').addClass('actv');
		$('#resViewT-button').removeClass('actv');
		$('#thelist').removeClass("reSline");
		sSettings.vTileList='tile';
		$.cookie('vhSettings',JSON.stringify(sSettings));
	});
	$('#resViewL-button').click(function(){
		$('#resViewL-button').removeClass('actv');
		$('#resViewT-button').addClass('actv');
		$('#thelist').addClass("reSline");
		sSettings.vTileList='list';
		$.cookie('vhSettings',JSON.stringify(sSettings));
	});
	$('#resViewT-button').html('<i class="icon-th icon-2x"></i>');
	$('#resViewT-button').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].resViewTile+'</font>');
	$('#resViewL-button').html('<i class="icon-th-list icon-2x"></i>');
	$('#resViewL-button').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].resViewList+'</font>');
	if(sSettings.vTileList=='list') {
		$('#thelist').removeClass("reSline").addClass("reSline");
		$('#resViewL-button').removeClass('actv');
		$('#resViewT-button').addClass('actv');
	} else if(sSettings.vTileList=='tile') {
		$('#thelist').removeClass("reSline");
		$('#resViewL-button').addClass('actv');
		$('#resViewT-button').removeClass('actv');
	}
	

	// parse url path..
	var prmstr = window.location.search.substr(1);
	var prmarr = prmstr.split ("&");
	var params = {};

	for ( var i = 0; i < prmarr.length; i++) {
		var tmparr = prmarr[i].split("=");
		params[tmparr[0]] = tmparr[1];
	}

	if(params.l) {
		sSettings.lang=lng(params.l);
		$.cookie('vhSettings',JSON.stringify(sSettings));
	}


	/* ==================== START I18N ===================== */

	
	$('#winModal_close').html('<i class="icon-remove"></i> '+i18n[sSettings.lang].close);
	
	$('#logosrch small').html(i18n[sSettings.lang].viewha_trn);
	$('#s').attr('placeholder',i18n[sSettings.lang].entrYInqH);

	$('#s').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].inpSrcQr+'</font>');
	$('#s').tipsy({html:true, gravity:'n', delayIn:700, delayOut:200});

	$('#leftSrcTrg_close').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].cnclSrcSite+'</font>');
	$('#leftSrcTrg_close').tipsy({html:true, gravity:'nw', delayIn:700, delayOut:200});

	$('#nav-button').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].navMenu+'</font>');
	$('#nav-button').tipsy({html:true, gravity:'nw', delayIn:700, delayOut:200});

	$('#clearButton').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].delSrcQr+'</font>');
	$('#clearButton').tipsy({html:true, gravity:'ne', delayIn:700, delayOut:200});

	$('#submitButton').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].srcButton+'</font>');
	$('#submitButton').tipsy({html:true, gravity:'ne', delayIn:700, delayOut:200});

	$('#goToUp').attr('original-title','<font class="fs15">'+i18n[sSettings.lang].goViewUp+'</font>');
	$('#goToUp').tipsy({html:true, gravity:'se', delayIn:700, delayOut:200});

	$('#resViewT-button').tipsy({html:true, gravity:'nw', delayIn:700, delayOut:200});
	$('#resViewL-button').tipsy({html:true, gravity:'nw', delayIn:700, delayOut:200});

	/* ==================== END I18N ===================== */
	
	if(params.q) {
		$("#s").val(decodeURIComponent(params.q));
		if(params.site) {
			$("#leftSrcTrg_ico").html('<img src="http://'+params.site+'/favicon.ico" class="ico" style="margin:4px 2px;" title="'+i18n[sSettings.lang].searchThisSite+' '+params.site+'">');
			goSearch({siteURL:params.site});
		} else {
			goSearch();
		}
	}

	if(sSettings.urlBckgrndImg!='') {
		//$('#backgroundfont').backstretch("http://dl.dropbox.com/u/515046/www/garfield-interior.jpg");
		$('#backgroundfont2').backstretch(sSettings.urlBckgrndImg);
	}

}());
});
